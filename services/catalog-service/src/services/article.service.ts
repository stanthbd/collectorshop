import { prisma } from '../db.js';
import { publishEvent } from '../rabbitmq.js';
import { logger } from '../utils/logger.js';

export class ArticleService {
    async createArticle(data: { sellerId: string; title: string; description: string; price: number }) {
        // Save to DB via Prisma explicitly defining status even if it's default
        const article = await prisma.article.create({
            data: {
                sellerId: data.sellerId,
                title: data.title,
                description: data.description,
                price: data.price,
                status: 'EN_ATTENTE_MODERATION',
            },
        });

        // Publish event to RabbitMQ
        await publishEvent('article.created', {
            articleId: article.id,
            sellerId: article.sellerId,
            title: article.title,
            description: article.description,
        });

        logger.info({ articleId: article.id, sellerId: article.sellerId }, 'Article created and entering moderation');

        return article;
    }

    async getArticlesBySeller(sellerId: string) {
        return prisma.article.findMany({
            where: { sellerId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async processModerationResult(data: { articleId: string; decision: 'OK' | 'KO'; reasons: string[] }) {
        const internalStatus = data.decision === 'OK' ? 'EN_ATTENTE_ADMIN' : 'REJETE_AUTO';
        const displayStatus = data.decision === 'OK' ? 'PENDING_ADMIN' : 'REJETE_AUTO';

        // Use a transaction to ensure both records are created/updated consistently
        await prisma.$transaction([
            prisma.article.update({
                where: { id: data.articleId },
                data: {
                    status: internalStatus,
                    contentCheckReasons: data.decision === 'KO' ? data.reasons : undefined,
                },
            }),
            prisma.articleModeration.create({
                data: {
                    articleId: data.articleId,
                    adminId: '00000000-0000-0000-0000-000000000000', // Mock UUID for system worker
                    decision: data.decision === 'OK' ? 'APPROVE' : 'REFUSE',
                    reason: data.decision === 'KO' ? data.reasons.join(', ') : 'Content automatically approved by worker',
                },
            }),
        ]);

        logger.info({ articleId: data.articleId, decision: data.decision, status: displayStatus }, 'Moderation result processed');
    }
    async getPendingArticles() {
        return prisma.article.findMany({
            where: { status: 'EN_ATTENTE_ADMIN' },
            orderBy: { createdAt: 'desc' },
        });
    }

    async approveArticle(adminId: string, articleId: string) {
        const result = await prisma.$transaction([
            prisma.article.update({
                where: { id: articleId },
                data: {
                    status: 'PUBLIE',
                    publishedAt: new Date(),
                },
            }),
            prisma.articleModeration.create({
                data: {
                    articleId,
                    adminId,
                    decision: 'APPROVE',
                    reason: 'Manually approved by admin',
                },
            }),
        ]);
        logger.info({ articleId, adminId, action: 'APPROVED' }, 'Article manually approved by admin');
        return result;
    }

    async refuseArticle(adminId: string, articleId: string, reason: string) {
        const result = await prisma.$transaction([
            prisma.article.update({
                where: { id: articleId },
                data: {
                    status: 'REFUSE',
                },
            }),
            prisma.articleModeration.create({
                data: {
                    articleId,
                    adminId,
                    decision: 'REFUSE',
                    reason,
                },
            }),
        ]);
        logger.info({ articleId, adminId, action: 'REJECTED', reason }, 'Article manually refused by admin');
        return result;
    }
    async getCatalogArticles(page = 1, limit = 10) {
        const skip = (page - 1) * limit;

        const [items, total] = await prisma.$transaction([
            prisma.article.findMany({
                where: { status: 'PUBLIE' },
                orderBy: { publishedAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.article.count({
                where: { status: 'PUBLIE' },
            })
        ]);

        return {
            items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            }
        };
    }
}

export const articleService = new ArticleService();
