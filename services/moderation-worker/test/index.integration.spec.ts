import amqp from 'amqplib';
import { startWorker } from '../src/index';

// Mock amqplib entirely for integration testing
jest.mock('amqplib', () => {
    let queues: Record<string, ((msg: amqp.ConsumeMessage) => void)[]> = {};
    let bindings: { queue: string; exchange: string; routingKey: string }[] = [];

    const mockChannel = {
        assertExchange: jest.fn().mockResolvedValue({ exchange: '' }),
        assertQueue: jest.fn().mockImplementation(async (queue) => {
            if (!queues[queue]) queues[queue] = [];
            return { queue, messageCount: 0, consumerCount: 0 };
        }),
        bindQueue: jest.fn().mockImplementation(async (queue: string, exchange: string, routingKey: string) => {
            bindings.push({ queue, exchange, routingKey });
            return {};
        }),
        consume: jest.fn().mockImplementation(async (queue, callback) => {
            if (!queues[queue]) queues[queue] = [];
            queues[queue].push(callback);
            return { consumerTag: 'mock_tag' };
        }),
        publish: jest.fn().mockImplementation((exchange, routingKey, content, options) => {
            const targetQueues = bindings.filter(b => b.exchange === exchange && b.routingKey === routingKey).map(b => b.queue);
            let delivered = false;
            for (const q of targetQueues) {
                const callbacks = queues[q] || [];
                const msg = {
                    fields: { consumerTag: 'mock_tag', deliveryTag: 1, redelivered: false, exchange, routingKey },
                    properties: { headers: options?.headers || {} } as amqp.MessageProperties,
                    content
                } as amqp.ConsumeMessage;
                callbacks.forEach(cb => cb(msg));
                delivered = true;
            }
            return delivered;
        }),
        ack: jest.fn(),
        nack: jest.fn(),
        close: jest.fn().mockImplementation(() => Promise.resolve()),
    };

    const mockConnection = {
        createChannel: jest.fn().mockResolvedValue(mockChannel),
        close: jest.fn().mockImplementation(() => Promise.resolve()),
        on: jest.fn(),
        removeAllListeners: jest.fn(),
    };

    return {
        connect: jest.fn().mockResolvedValue(mockConnection),
        __getMockChannel: () => mockChannel,
        __resetMock: () => {
            queues = {};
            bindings = [];
            jest.clearAllMocks();
        }
    };
});

interface MockedAmqplib {
    connect: jest.MockedFunction<typeof amqp.connect>;
    __getMockChannel: () => jest.Mocked<amqp.Channel>;
    __resetMock: () => void;
}

const mockedAmqp = amqp as jest.Mocked<typeof amqp> & MockedAmqplib;

describe('Moderation Worker Integration', () => {
    let mockChannel: jest.Mocked<amqp.Channel>;
    let workerHandle: { shutdown: () => Promise<void> } | undefined;

    beforeEach(() => {
        mockedAmqp.__resetMock();
        mockChannel = mockedAmqp.__getMockChannel();
    });

    afterEach(async () => {
        if (workerHandle) {
            await workerHandle.shutdown();
            workerHandle = undefined;
        }
    });

    it('should process full flow from setup to publish', async () => {
        // Start the worker
        workerHandle = await startWorker();

        expect(amqp.connect).toHaveBeenCalled();

        // Simulate publishing an article.created event
        const payload = {
            articleId: 'test-art-1',
            sellerId: 'test-seller',
            title: 'Test Title Integration',
            description: 'This is a description that is long enough to pass validation in checks.',
        };

        mockChannel.publish('collector.events', 'article.created', Buffer.from(JSON.stringify(payload)), {
            headers: { 'x-trace-id': 'integration-trace' }
        });

        // Small delay to let promises resolve if any
        await new Promise(resolve => setTimeout(resolve, 10));

        // Wait to make sure output gets published
        const publishCalls = mockChannel.publish.mock.calls;
        const resultPublishCall = publishCalls.find((call) => call[1] === 'article.moderation.result');

        expect(resultPublishCall).toBeDefined();
        if (resultPublishCall) {
            const publishedBuffer = resultPublishCall[2] as Buffer;
            expect(JSON.parse(publishedBuffer.toString())).toEqual({
                articleId: 'test-art-1',
                decision: 'OK',
                reasons: [],
            });
            const options = resultPublishCall[3] as amqp.Options.Publish | undefined;
            expect(options?.headers).toStrictEqual({ 'x-trace-id': 'integration-trace' });
        }
    });

    it('should process KO flow', async () => {
        workerHandle = await startWorker();

        const payload = {
            articleId: 'test-art-2',
            sellerId: 'test-seller',
            title: 'Test arnaque Title',
            description: 'This is a description that is arnaque and fake.',
        };

        mockChannel.publish('collector.events', 'article.created', Buffer.from(JSON.stringify(payload)), {
            headers: {}
        });

        await new Promise(resolve => setTimeout(resolve, 10));

        const publishCalls = mockChannel.publish.mock.calls;
        const resultPublishCall = publishCalls.find((call) => call[1] === 'article.moderation.result');

        expect(resultPublishCall).toBeDefined();
        if (resultPublishCall) {
            const publishedBuffer = resultPublishCall[2] as Buffer;
            const res = JSON.parse(publishedBuffer.toString());
            expect(res.decision).toBe('KO');
            expect(res.reasons.length).toBeGreaterThan(0);
        }
    });
});
