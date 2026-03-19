import * as amqp from 'amqplib';
import { Connection, Channel } from 'amqplib';
import { articleService } from './services/article.service.js';
import { logger } from './utils/logger.js';
import { asyncLocalStorage } from './utils/async-storage.js';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://collector:password@localhost:5672';
const EXCHANGE_NAME = 'collector.events';

let connection: any | null = null;
let channel: any | null = null;
let isConnecting = false;

export async function connectRabbitMQ() {
    if (isConnecting) return;
    isConnecting = true;

    try {
        logger.info('Connecting to RabbitMQ...');
        connection = await amqp.connect(RABBITMQ_URL);

        connection.on('error', (err: any) => {
            logger.error({ err }, 'RabbitMQ connection error');
        });

        connection.on('close', () => {
            logger.warn('RabbitMQ connection closed - reconnecting in 5s');
            connection = null;
            channel = null;
            setTimeout(reconnect, 5000);
        });

        channel = await connection.createChannel();
        if (!channel) throw new Error('Failed to create RabbitMQ channel');

        channel.on('error', (err: any) => {
            logger.error({ err }, 'RabbitMQ channel error');
        });

        channel.on('close', () => {
            logger.warn('RabbitMQ channel closed');
            channel = null;
        });

        if (!channel) throw new Error('RabbitMQ channel is null unexpectedly');
        await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
        logger.info('Connected to RabbitMQ');
        
        // Re-setup consumers if we reconnected
        await setupConsumers();

    } catch (err: any) {
        logger.error({ err }, 'RabbitMQ connection failed - retrying in 5s');
        connection = null;
        channel = null;
        setTimeout(reconnect, 5000);
    } finally {
        isConnecting = false;
    }
}

async function reconnect() {
    if (!connection) {
        await connectRabbitMQ();
    }
}

export async function closeRabbitMQ() {
    try {
        if (channel) await channel.close();
        if (connection) await connection.close();
    } catch (err: any) {
        logger.error({ err }, 'Error closing RabbitMQ connection');
    } finally {
        channel = null;
        connection = null;
    }
}

export async function publishEvent<T>(routingKey: string, payload: T) {
    try {
        if (!channel) {
            logger.warn({ routingKey }, 'Cannot publish event: RabbitMQ channel not ready');
            return;
        }

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
    } catch (err) {
        logger.error({ err, routingKey }, 'Failed to publish event to RabbitMQ');
        throw err;
    }
}

export async function setupConsumers() {
    if (!channel) return;

    try {
        const q = await channel.assertQueue('catalog_moderation_queue', { durable: true });
        await channel.bindQueue(q.queue, EXCHANGE_NAME, 'article.moderation.result');

        logger.info({ queue: q.queue }, `Waiting for moderation results`);

        await channel.consume(q.queue, async (msg: amqp.ConsumeMessage | null) => {
            if (msg !== null) {
                const traceId = msg.properties.headers?.['x-trace-id'];
                const userId = msg.properties.headers?.['x-user-id'];
                const store = new Map<string, string>();
                if (traceId) store.set('traceId', traceId);
                if (userId) store.set('userId', userId);

                await asyncLocalStorage.run(store, async () => {
                    try {
                        const payload = JSON.parse(msg.content.toString());
                        logger.info({ articleId: payload.articleId }, 'Received moderation result');

                        await articleService.processModerationResult(payload);

                        if (channel) {
                            channel.ack(msg);
                        }
                    } catch (err) {
                        logger.error({ err, articleId: msg.content.toString() }, 'Error processing moderation result');
                        if (channel) {
                            channel.nack(msg, false, false);
                        }
                    }
                });
            }
        }, { noAck: false });
    } catch (err) {
        logger.error({ err }, 'Failed to setup RabbitMQ consumers');
    }
}
