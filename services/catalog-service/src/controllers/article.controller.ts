import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.js';
import { articleService } from '../services/article.service.js';
import { logger } from '../utils/logger.js';

const CreateArticleSchema = z.object({
    title: z.string().min(5).max(100),
    description: z.string().min(20).max(5000),
    price: z.number().positive(),
});

export class ArticleController {
    async createArticle(req: AuthRequest, res: Response) {
        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
        const sellerId = req.user.id;
        const parseResult = CreateArticleSchema.safeParse(req.body);

        if (!parseResult.success) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: parseResult.error.issues,
            });
        }

        const { title, description, price } = parseResult.data;

        const article = await articleService.createArticle({
            sellerId,
            title,
            description,
            price,
        });

        res.status(201).json(article);
    }

    async getMyArticles(req: AuthRequest, res: Response) {
        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
        const sellerId = req.user.id;
        const articles = await articleService.getArticlesBySeller(sellerId);
        res.json(articles);
    }

    async getPendingArticles(_req: AuthRequest, res: Response) {
        const articles = await articleService.getPendingArticles();
        res.json(articles);
    }

    async approveArticle(req: AuthRequest, res: Response) {
        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
        const adminId = req.user.id;
        const { id } = req.params;

        try {
            await articleService.approveArticle(adminId, id);
            res.status(200).json({ message: 'Article approved' });
        } catch (error) {
            logger.error({ error, articleId: id }, 'Failed to approve article');
            res.status(500).json({ message: 'Failed to approve article' });
        }
    }

    async refuseArticle(req: AuthRequest, res: Response) {
        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
        const adminId = req.user.id;
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason || typeof reason !== 'string' || reason.trim() === '') {
            return res.status(400).json({ message: 'A rejection reason is required' });
        }

        try {
            await articleService.refuseArticle(adminId, id, reason);
            res.status(200).json({ message: 'Article refused' });
        } catch (error) {
            logger.error({ error, articleId: id, reason }, 'Failed to refuse article');
            res.status(500).json({ message: 'Failed to refuse article' });
        }
    }

    async getCatalog(req: Request, res: Response) {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const paginatedResult = await articleService.getCatalogArticles(
            Math.max(1, page),
            Math.max(1, Math.min(limit, 50)) // cap limit at 50
        );
        res.json(paginatedResult);
    }
}

export const articleController = new ArticleController();
