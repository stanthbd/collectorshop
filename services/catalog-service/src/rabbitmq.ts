import amqp from 'amqplib';
import { articleService } from './services/article.service';
import { logger } from './utils/logger';
import { asyncLocalStorage } from './utils/async-storage';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://collector:password@localhost:5672';
const EXCHANGE_NAME = 'collector.events';

let channel: amqp.Channel | null = null;
let connection: amqp.ChannelModel | null = null;

export async function connectRabbitMQ() {
    if (channel && connection) return channel;

    try {
        logger.info('Connecting to RabbitMQ...');
        connection = await amqp.connect(RABBITMQ_URL);

        connection.on('error', (err) => {
            logger.error({ err }, 'RabbitMQ connection error');
            connection = null;
            channel = null;
        });

        connection.on('close', () => {
            logger.warn('RabbitMQ connection closed');
            connection = null;
            channel = null;
        });

        channel = await connection.createChannel();

        channel.on('error', (err) => {
            logger.error({ err }, 'RabbitMQ channel error');
            channel = null;
        });

        channel.on('close', () => {
            logger.warn('RabbitMQ channel closed');
            channel = null;
        });

        await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
        logger.info('Connected to RabbitMQ for publishing');
        return channel;
    } catch (err) {
        connection = null;
        channel = null;
        if (err instanceof Error) {
            logger.error({ err }, 'RabbitMQ connection failed');
        }
        throw err;
    }
}

export async function closeRabbitMQ() {
    try {
        if (channel) await channel.close();
        if (connection) await connection.close();
    } catch (err) {
        logger.error({ err }, 'Error closing RabbitMQ connection');
    } finally {
        channel = null;
        connection = null;
    }
}

export async function publishEvent<T>(routingKey: string, payload: T) {
    try {
        if (!channel) {
            await connectRabbitMQ();
        }

        if (channel) {
            const store = asyncLocalStorage.getStore();
            const headers: Record<string, string> = {};

            const traceId = store?.get('traceId');
            if (typeof traceId === 'string') headers['x-trace-id'] = traceId;

            const userId = store?.get('userId');
            if (typeof userId === 'string') headers['x-user-id'] = userId;

            const wasPublished = channel.publish(
                EXCHANGE_NAME,
                routingKey,
                Buffer.from(JSON.stringify(payload)),
                {
                    persistent: true,
                    headers
                }
            );

            if (!wasPublished) {
                logger.warn({ routingKey }, 'Event publication was throttled (buffer full)');
            } else {
                logger.debug({ routingKey, payload }, 'Event published to RabbitMQ');
            }
        } else {
            throw new Error('Could not establish RabbitMQ channel to publish event');
        }
    } catch (err) {
        logger.error({ err, routingKey }, 'Failed to publish event to RabbitMQ');
        // Re-throw to inform the caller (e.g. to trigger a 500 error at the controller level if it's critical)
        throw err;
    }
}

// Trigger CI build with RabbitMQ reconnection fix v2
export async function setupConsumers() {
    if (!channel) {
        await connectRabbitMQ();
    }
    if (!channel) return;

    const q = await channel.assertQueue('catalog_moderation_queue', { durable: true });
    await channel.bindQueue(q.queue, EXCHANGE_NAME, 'article.moderation.result');

    logger.info({ queue: q.queue }, `Waiting for moderation results`);

    channel.consume(q.queue, async (msg: amqp.ConsumeMessage | null) => {
        if (msg !== null) {
            const traceId = msg.properties.headers?.['x-trace-id'];
            const userId = msg.properties.headers?.['x-user-id'];
            const store = new Map<string, string>();
            if (traceId) store.set('traceId', traceId);
            if (userId) store.set('userId', userId);

            asyncLocalStorage.run(store, async () => {
                try {
                    const payload = JSON.parse(msg.content.toString());
                    logger.info({ articleId: payload.articleId }, 'Received moderation result');

                    await articleService.processModerationResult(payload);

                    if (channel) {
                        channel.ack(msg);
                    }
                } catch (err) {
                    if (err instanceof Error) {
                        logger.error({ err }, 'Error processing moderation result');
                    } else {
                        logger.error({ err: String(err) }, 'Error processing moderation result (unknown type)');
                    }
                    if (channel) {
                        channel.nack(msg, false, false);
                    }
                }
            });
        }
    }, { noAck: false });
}
