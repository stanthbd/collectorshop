import 'express-async-errors';
import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import articlesRouter from './routes/articles.js';
import { logger } from './utils/logger.js';
import { asyncLocalStorage } from './utils/async-storage.js';

const app = express();
app.use(express.json());

app.use((req: Request, _res: Response, next: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || crypto.randomUUID();
    const store = new Map<string, string>();
    store.set('traceId', traceId);
    asyncLocalStorage.run(store, () => {
        next();
    });
});

// Health endpoint
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'catalog-service', timestamp: new Date().toISOString() });
});

// Attach routers
app.use('/api', articlesRouter);

// Basic error handler — Express requires exactly 4 params to detect error middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error({ err }, '[Error fallback]');
    res.status(500).json({ message: 'Internal Server Error' });
});

export default app;
