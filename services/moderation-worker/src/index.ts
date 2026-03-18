import amqp from 'amqplib';
import { checkArticleContent } from './contentCheck';
import { logger } from './utils/logger';
import { asyncLocalStorage } from './utils/async-storage';
import express from 'express';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://collector:password@localhost:5672';
const EXCHANGE_NAME = 'collector.events';

interface ArticleCreatedEvent {
    articleId: string;
    sellerId: string;
    title: string;
    description: string;
}

interface ModerationResultEvent {
    articleId: string;
    decision: 'OK' | 'KO';
    reasons: string[];
}

export async function setupWorker(channel: amqp.Channel) {
    // Ensure exchange exists
    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });

    // Setup queue for moderation
    const q = await channel.assertQueue('moderation_queue', { durable: true });

    // Bind queue to the article.created routing key
    await channel.bindQueue(q.queue, EXCHANGE_NAME, 'article.created');

    // Prevent message loss by ensuring the return queue exists even if catalog-service is down
    const returnQ = await channel.assertQueue('catalog_moderation_queue', { durable: true });
    await channel.bindQueue(returnQ.queue, EXCHANGE_NAME, 'article.moderation.result');

    logger.info({ queue: q.queue }, `Waiting for messages. To exit press CTRL+C`);

    await channel.consume(q.queue, (msg) => {
        if (msg !== null) {
            const traceId = msg.properties.headers?.['x-trace-id'];
            const userId = msg.properties.headers?.['x-user-id'];
            const store = new Map<string, string>();
            if (traceId) store.set('traceId', traceId);
            if (userId) store.set('userId', userId);

            asyncLocalStorage.run(store, () => {
                try {
                    const payload: ArticleCreatedEvent = JSON.parse(msg.content.toString());
                    logger.info({ articleId: payload.articleId, sellerId: payload.sellerId }, 'Received article.created event');

                    // Perform moderation check
                    const result = checkArticleContent(payload.title, payload.description);
                    logger.debug({ articleId: payload.articleId, decision: result.decision, reasons: result.reasons }, 'Moderation check completed');

                    // Publish result
                    const resultEvent: ModerationResultEvent = {
                        articleId: payload.articleId,
                        decision: result.decision,
                        reasons: result.reasons,
                    };

                    const headers: Record<string, string> = {};
                    if (traceId) headers['x-trace-id'] = traceId;
                    if (userId) headers['x-user-id'] = userId;

                    channel.publish(
                        EXCHANGE_NAME,
                        'article.moderation.result',
                        Buffer.from(JSON.stringify(resultEvent)),
                        { persistent: true, headers }
                    );

                    logger.info({ articleId: payload.articleId, decision: result.decision, status: result.decision === 'OK' ? 'APPROVED' : 'REJECTED' }, 'Published article.moderation.result');

                    // Ack the message
                    channel.ack(msg);
                } catch (err) {
                    if (err instanceof Error) {
                        logger.error({ err }, 'Error processing message');
                    } else {
                        logger.error({ err: String(err) }, 'Error processing message (unknown type)');
                    }
                    // Reject and don't requeue if it's a structural parsing error we can't recover from
                    channel.nack(msg, false, false);
                }
            });
        }
    }, {
        noAck: false
    });
}

export async function startWorker() {
    // Basic health check server for K8s probes
    const app = express();
    const port = process.env.HEALTH_PORT || 3000;

    app.get('/health', (_req, res) => {
        res.json({ status: 'ok', service: 'moderation-worker', timestamp: new Date().toISOString() });
    });

    const server = app.listen(port, () => {
        logger.info({ port }, 'Moderation worker health server started');
    });

    try {
        logger.info('Connecting to RabbitMQ...');
        const connection = await amqp.connect(RABBITMQ_URL);

        connection.on('error', (err) => {
            logger.error({ err }, 'RabbitMQ connection error - exiting for restart');
            process.exit(1);
        });

        connection.on('close', () => {
            logger.warn('RabbitMQ connection closed - exiting for restart');
            process.exit(1);
        });

        const channel = await connection.createChannel();
        logger.info('Connected to RabbitMQ successfully');

        await setupWorker(channel);

        // Handle graceful shutdown
        const shutdown = async () => {
            await channel.close();
            await connection.close();
            server.close();
        };

        process.on('SIGINT', async () => {
            await shutdown();
            process.exit(0);
        });

        return { server, connection, channel, shutdown };

    } catch (error) {
        if (error instanceof Error) {
            logger.error({ err: error.message }, 'Failed to start worker');
        } else {
            logger.error({ err: String(error) }, 'Failed to start worker (unknown type)');
        }
        server.close();
        throw error;
    }
}

if (process.env.NODE_ENV !== 'test') {
    startWorker();
}

// Trigger CI pipeline build tests