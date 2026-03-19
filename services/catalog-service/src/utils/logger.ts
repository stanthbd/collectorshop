import pino from 'pino';
import { asyncLocalStorage } from './async-storage.js';

export const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    base: {
        service: 'catalog-service'
    },
    formatters: {
        level: (label) => {
            return { level: label };
        },
    },
    mixin() {
        const store = asyncLocalStorage.getStore();
        if (!store) return {};
        return {
            traceId: store.get('traceId'),
            userId: store.get('userId'),
        };
    },
    // In production, we want raw JSON for Loki. In dev, we can use pino-pretty if desired.
    // For this observability task, we enforce JSON to test Loki parsing.
    transport: process.env.NODE_ENV === 'development' && process.env.PRETTY_LOGS === 'true'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
});
