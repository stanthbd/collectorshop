import { jest } from '@jest/globals';
import amqp from 'amqplib';

jest.unstable_mockModule('../src/contentCheck.js', () => ({
    checkArticleContent: jest.fn(),
}));

jest.unstable_mockModule('../src/utils/logger.js', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    }
}));

// Import after the modules are mocked
const { setupWorker } = await import('../src/index.js');
const contentCheck = await import('../src/contentCheck.js');

describe('Moderation Worker Unit Tests', () => {
    let consumeCallback: (msg: amqp.ConsumeMessage | null) => void;
    let mockChannel: jest.Mocked<amqp.Channel>;

    const createMockMessage = (payloadStr: string, headers: Record<string, string> = {}): amqp.ConsumeMessage => ({
        fields: { consumerTag: 'mock_tag', deliveryTag: 1, redelivered: false, exchange: 'collector.events', routingKey: 'article.created' },
        properties: { contentType: undefined, contentEncoding: undefined, headers, deliveryMode: undefined, priority: undefined, correlationId: undefined, replyTo: undefined, expiration: undefined, messageId: undefined, timestamp: undefined, type: undefined, userId: undefined, appId: undefined, clusterId: undefined },
        content: Buffer.from(payloadStr)
    });

    beforeEach(() => {
        jest.clearAllMocks();

        mockChannel = {
            assertExchange: jest.fn().mockResolvedValue(undefined),
            assertQueue: jest.fn().mockResolvedValue({ queue: 'mock_queue' }),
            bindQueue: jest.fn().mockResolvedValue(undefined),
            consume: jest.fn().mockImplementation((queue, callback) => {
                consumeCallback = callback;
                return Promise.resolve({ consumerTag: 'mock_tag' });
            }),
            publish: jest.fn().mockReturnValue(true),
            ack: jest.fn(),
            nack: jest.fn(),
            close: jest.fn().mockResolvedValue(undefined),
        } as unknown as jest.Mocked<amqp.Channel>;
    });

    it('should setup exchange, queues and bind them', async () => {
        await setupWorker(mockChannel);
        expect(mockChannel.assertExchange).toHaveBeenCalledWith('collector.events', 'topic', { durable: true });
        expect(mockChannel.assertQueue).toHaveBeenCalledWith('moderation_queue', { durable: true });
        expect(mockChannel.assertQueue).toHaveBeenCalledWith('catalog_moderation_queue', { durable: true });
        expect(mockChannel.bindQueue).toHaveBeenCalledWith('mock_queue', 'collector.events', 'article.created');
        expect(mockChannel.bindQueue).toHaveBeenCalledWith('mock_queue', 'collector.events', 'article.moderation.result');
        expect(mockChannel.consume).toHaveBeenCalledWith('mock_queue', expect.any(Function), { noAck: false });
    });

    it('should process a valid message, check it, and publish OK result', async () => {
        (contentCheck.checkArticleContent as jest.Mock).mockReturnValue({
            decision: 'OK',
            reasons: [],
        });

        await setupWorker(mockChannel);
        expect(consumeCallback).toBeDefined();

        const mockMsg = createMockMessage(JSON.stringify({
            articleId: 'art-1',
            sellerId: 'sell-1',
            title: 'Valid Title',
            description: 'Valid Description',
        }), { 'x-trace-id': 'trace-123', 'x-user-id': 'user-123' });

        consumeCallback(mockMsg);

        expect(contentCheck.checkArticleContent).toHaveBeenCalledWith('Valid Title', 'Valid Description');

        await new Promise(process.nextTick);

        expect(mockChannel.publish).toHaveBeenCalledWith(
            'collector.events',
            'article.moderation.result',
            expect.any(Buffer),
            { persistent: true, headers: { 'x-trace-id': 'trace-123', 'x-user-id': 'user-123' } }
        );

        const publishCall = mockChannel.publish.mock.calls[0];
        const publishedBuffer = publishCall[2] as Buffer;
        expect(JSON.parse(publishedBuffer.toString())).toEqual({
            articleId: 'art-1',
            decision: 'OK',
            reasons: [],
        });

        expect(mockChannel.ack).toHaveBeenCalledWith(mockMsg);
    });

    it('should process a valid message, check it, and publish KO result', async () => {
        (contentCheck.checkArticleContent as jest.Mock).mockReturnValue({
            decision: 'KO',
            reasons: ['Bad word'],
        });

        await setupWorker(mockChannel);

        const mockMsg = createMockMessage(JSON.stringify({
            articleId: 'art-1',
            sellerId: 'sell-1',
            title: 'Invalid Title',
            description: 'Bad Description with Bad word',
        }), {});

        consumeCallback(mockMsg);

        expect(contentCheck.checkArticleContent).toHaveBeenCalledWith('Invalid Title', 'Bad Description with Bad word');

        await new Promise(process.nextTick);

        const publishCall = mockChannel.publish.mock.calls[0];
        const publishedBuffer = publishCall[2] as Buffer;
        expect(JSON.parse(publishedBuffer.toString())).toEqual({
            articleId: 'art-1',
            decision: 'KO',
            reasons: ['Bad word'],
        });

        expect(mockChannel.ack).toHaveBeenCalledWith(mockMsg);
    });

    it('should nack message on JSON parse error without requeue', async () => {
        await setupWorker(mockChannel);

        const mockMsg = createMockMessage('invalid json', {});

        consumeCallback(mockMsg);

        await new Promise(process.nextTick);

        expect(mockChannel.nack).toHaveBeenCalledWith(mockMsg, false, false);
        expect(mockChannel.ack).not.toHaveBeenCalled();
        expect(mockChannel.publish).not.toHaveBeenCalled();
    });
});
