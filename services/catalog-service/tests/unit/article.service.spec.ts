import { articleService } from '../../src/services/article.service';
import { prisma } from '../../src/db';

jest.mock('../../src/db', () => ({
    prisma: {
        article: {
            update: jest.fn(),
        },
        articleModeration: {
            create: jest.fn(),
        },
        $transaction: jest.fn((promises) => Promise.all(promises)),
    },
}));

describe('Unit: ArticleService Admin Moderation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should approve an article and create audit log', async () => {
        const adminId = 'adm-123';
        const articleId = 'art-789';

        (prisma.$transaction as jest.Mock).mockResolvedValue([{}, {}]);

        await articleService.approveArticle(adminId, articleId);

        expect(prisma.$transaction).toHaveBeenCalled();
        expect(prisma.article.update).toHaveBeenCalledWith({
            where: { id: articleId },
            data: expect.objectContaining({
                status: 'PUBLIE',
                publishedAt: expect.any(Date),
            }),
        });
        expect(prisma.articleModeration.create).toHaveBeenCalledWith({
            data: {
                articleId,
                adminId,
                decision: 'APPROVE',
                reason: 'Manually approved by admin',
            },
        });
    });

    it('should refuse an article and create audit log with reason', async () => {
        const adminId = 'adm-123';
        const articleId = 'art-789';
        const reason = 'Does not meet guidelines.';

        (prisma.$transaction as jest.Mock).mockResolvedValue([{}, {}]);

        await articleService.refuseArticle(adminId, articleId, reason);

        expect(prisma.$transaction).toHaveBeenCalled();
        expect(prisma.article.update).toHaveBeenCalledWith({
            where: { id: articleId },
            data: {
                status: 'REFUSE',
            },
        });
        expect(prisma.articleModeration.create).toHaveBeenCalledWith({
            data: {
                articleId,
                adminId,
                decision: 'REFUSE',
                reason,
            },
        });
    });
});
