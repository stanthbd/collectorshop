import 'dotenv/config';
import app from './app.js';
import { connectRabbitMQ, setupConsumers } from './rabbitmq.js';
import { logger } from './utils/logger.js';

const PORT = process.env.PORT ?? 3000;

async function bootstrap() {
    // RabbitMQ can legitimately take time to boot (e.g. first start on K8s with PV).
    // Avoid fast CrashLoopBackOff by retrying for a while before giving up.
    const maxAttempts = Number(process.env.RABBITMQ_CONNECT_MAX_ATTEMPTS ?? 60);
    const baseDelayMs = Number(process.env.RABBITMQ_CONNECT_BASE_DELAY_MS ?? 2000);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            await connectRabbitMQ();
            await setupConsumers();
            break;
        } catch (err) {
            const delayMs = Math.min(baseDelayMs * attempt, 15000);
            logger.warn(
                { attempt, maxAttempts, delayMs, err },
                'RabbitMQ not ready yet; retrying'
            );
            await new Promise((r) => setTimeout(r, delayMs));

            if (attempt === maxAttempts) {
                logger.error({ err }, 'Failed to initialize RabbitMQ after retries — exiting so Kubernetes can restart');
                process.exit(1);
            }
        }
    }

    app.listen(PORT, () => {
        logger.info({ port: PORT }, `catalog-service running on port ${PORT}`);
    });
}

bootstrap();

// Trigger CI pipeline build test
