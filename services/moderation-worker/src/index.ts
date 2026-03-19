import * as amqp from 'amqplib';
import { checkArticleContent } from './contentCheck.js';
import { logger } from './utils/logger.js';
import { asyncLocalStorage } from './utils/async-storage.js';
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

    await channel.consume(q.queue, (msg: amqp.ConsumeMessage | null) => {
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
                } catch (err: unknown) {
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

let connection: amqp.ChannelModel | null = null;
let channel: amqp.Channel | null = null;
let isConnecting = false;

export async function startWorker() {
    if (isConnecting) return;
    isConnecting = true;

    // Basic health check server for K8s probes (only start once)
    const app = express();
    const port = process.env.HEALTH_PORT || 3000;
    app.get('/health', (_req: express.Request, res: express.Response) => {
        res.json({ status: 'ok', service: 'moderation-worker', timestamp: new Date().toISOString() });
    });
    const server = app.listen(port, () => {
        logger.info({ port }, 'Moderation worker health server started');
    });

    const connect = async () => {
        try {
            logger.info('Connecting to RabbitMQ...');
            const conn = await amqp.connect(RABBITMQ_URL);
            connection = conn;

            conn.on('error', (err: Error) => {
                logger.error({ err }, 'RabbitMQ connection error');
            });

            conn.on('close', () => {
                logger.warn('RabbitMQ connection closed - reconnecting in 5s');
                connection = null;
                channel = null;
                setTimeout(connect, 5000);
            });

            const ch = await conn.createChannel();
            channel = ch;
            if (!ch) throw new Error('Failed to create RabbitMQ channel');

            ch.on('error', (err: Error) => {
                logger.error({ err }, 'RabbitMQ channel error');
            });
            ch.on('close', () => {
                logger.warn('RabbitMQ channel closed');
                channel = null;
            });

            logger.info('Connected to RabbitMQ successfully');
            await setupWorker(ch);

        } catch (err: unknown) {
            logger.error({ err }, 'RabbitMQ connection failed - retrying in 5s');
            connection = null;
            channel = null;
            setTimeout(connect, 5000);
        }
    };

    await connect();

    // Handle graceful shutdown
    const shutdown = async () => {
        if (channel) await channel.close();
        if (connection) await connection.close();
        await new Promise<void>((resolve) => server.close(() => resolve()));
        connection = null;
        channel = null;
        isConnecting = false;
    };

    process.on('SIGINT', async () => {
        await shutdown();
        process.exit(0);
    });

    return { shutdown };
}

if (process.env.NODE_ENV !== 'test') {
    startWorker().catch((err) => {
        if (err instanceof Error) {
            logger.error({ err }, 'Moderation worker failed to start');
        } else {
            logger.error({ err: String(err) }, 'Moderation worker failed to start (unknown type)');
        }
        process.exit(1);
    });
}

// Trigger CI pipeline build tests