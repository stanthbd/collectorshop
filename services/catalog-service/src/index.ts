import 'dotenv/config';
import app from './app';
import { connectRabbitMQ, setupConsumers } from './rabbitmq';
import { logger } from './utils/logger';

const PORT = process.env.PORT ?? 3000;

async function bootstrap() {
    try {
        await connectRabbitMQ();
        await setupConsumers();
    } catch (err) {
        logger.error({ err }, 'Failed to initialize RabbitMQ connection on startup — exiting so Docker can restart');
        process.exit(1);
    }

    app.listen(PORT, () => {
        logger.info({ port: PORT }, `catalog-service running on port ${PORT}`);
    });
}

bootstrap();

// Trigger CI pipeline build test
