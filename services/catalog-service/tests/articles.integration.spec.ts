import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import { publishEvent } from '../src/rabbitmq';
import { prisma } from '../src/db';
import { articleService } from '../src/services/article.service';

jest.mock('../src/rabbitmq', () => ({
    publishEvent: jest.fn(),
    connectRabbitMQ: jest.fn(),
}));

jest.mock('../src/db', () => ({
    prisma: {
        article: {
            create: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
        },
        articleModeration: {
            create: jest.fn(),
        },
        $transaction: jest.fn((promises) => Promise.all(promises)),
    },
}));

describe('Integration: Articles API', () => {
    const sellerId = 'sel-123';
    const role = 'seller';
    const validToken = generateMockToken(sellerId, [role]);
    const adminToken = generateMockToken('adm-456', ['admin']);

    function generateMockToken(sub: string, roles: string[]) {
        return jwt.sign(
            { sub, realm_access: { roles } },
            'dummy-secret',
            { algorithm: 'HS256' }
        );
    }

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /articles', () => {
        it('should reject unauthorized request without token', async () => {
            const response = await request(app)
                .post('/api/articles')
                .send({ title: 'Vintage Watch', description: 'A nice watch. A nice watch.', price: 100 });
            expect(response.status).toBe(401);
        });

        it('should reject if user does not have seller role', async () => {
            const response = await request(app)
                .post('/api/articles')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ title: 'Vintage Watch', description: 'A nice watch. A nice watch.', price: 100 });
            expect(response.status).toBe(403);
        });

        it('should reject invalid payload (price <= 0)', async () => {
            const response = await request(app)
                .post('/api/articles')
                .set('Authorization', `Bearer ${validToken}`)
                .send({ title: 'Vintage Watch', description: 'A nice watch. A nice watch.', price: -5 });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Validation failed');
        });

        it('should create article with EN_ATTENTE_MODERATION and publish event', async () => {
            const newArticle = {
                id: 'art-789',
                sellerId,
                title: 'Vintage Watch',
                description: 'A nice watch. A nice watch.',
                price: 100,
                status: 'EN_ATTENTE_MODERATION',
                createdAt: new Date().toISOString(),
            };

            (prisma.article.create as jest.Mock).mockResolvedValue(newArticle);

            const response = await request(app)
                .post('/api/articles')
                .set('Authorization', `Bearer ${validToken}`)
                .send({ title: 'Vintage Watch', description: 'A nice watch. A nice watch.', price: 100 });

            expect(response.status).toBe(201);
            expect(response.body.status).toBe('EN_ATTENTE_MODERATION');
            expect(prisma.article.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    sellerId,
                    title: 'Vintage Watch',
                    price: 100,
                    status: 'EN_ATTENTE_MODERATION',
                }),
            });
            expect(publishEvent).toHaveBeenCalledWith('article.created', expect.objectContaining({
                articleId: 'art-789',
                sellerId,
            }));
        });
    });

    describe('GET /me/articles', () => {
        it('should return articles only for the logged in seller', async () => {
            const articlesList = [
                { id: '1', sellerId, title: 'Item 1' },
                { id: '2', sellerId, title: 'Item 2' },
            ];

            (prisma.article.findMany as jest.Mock).mockResolvedValue(articlesList);

            const response = await request(app)
                .get('/api/me/articles')
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(2);
            expect(response.body[0].sellerId).toBe(sellerId);
            expect(prisma.article.findMany).toHaveBeenCalledWith({
                where: { sellerId },
                orderBy: { createdAt: 'desc' },
            });
        });
    });

    describe('RabbitMQ processModerationResult', () => {
        it('should update article to EN_ATTENTE_ADMIN and create moderation record on OK', async () => {
            (prisma.$transaction as jest.Mock).mockResolvedValue([{}, {}]);

            await articleService.processModerationResult({
                articleId: 'art-123',
                decision: 'OK',
                reasons: []
            });

            expect(prisma.$transaction).toHaveBeenCalled();
            expect(prisma.article.update).toHaveBeenCalledWith({
                where: { id: 'art-123' },
                data: {
                    status: 'EN_ATTENTE_ADMIN',
                    contentCheckReasons: undefined
                }
            });
            expect(prisma.articleModeration.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    articleId: 'art-123',
                    adminId: '00000000-0000-0000-0000-000000000000',
                    decision: 'APPROVE',
                    reason: 'Content automatically approved by worker'
                })
            });
        });

        it('should update article to REJETE_AUTO and create moderation record on KO', async () => {
            (prisma.$transaction as jest.Mock).mockResolvedValue([{}, {}]);

            await articleService.processModerationResult({
                articleId: 'art-456',
                decision: 'KO',
                reasons: ['bad word', 'too short']
            });

            expect(prisma.$transaction).toHaveBeenCalled();
            expect(prisma.article.update).toHaveBeenCalledWith({
                where: { id: 'art-456' },
                data: {
                    status: 'REJETE_AUTO',
                    contentCheckReasons: ['bad word', 'too short']
                }
            });
            expect(prisma.articleModeration.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    articleId: 'art-456',
                    adminId: '00000000-0000-0000-0000-000000000000',
                    decision: 'REFUSE',
                    reason: 'bad word, too short'
                })
            });
        });
    });

    describe('Admin Moderation API', () => {
        describe('GET /admin/articles/pending', () => {
            it('should return EN_ATTENTE_ADMIN articles for admin role', async () => {
                const pendingArticles = [
                    { id: '1', status: 'EN_ATTENTE_ADMIN' },
                    { id: '2', status: 'EN_ATTENTE_ADMIN' },
                ];
                (prisma.article.findMany as jest.Mock).mockResolvedValue(pendingArticles);

                const response = await request(app)
                    .get('/api/admin/articles/pending')
                    .set('Authorization', `Bearer ${adminToken}`);

                expect(response.status).toBe(200);
                expect(response.body).toEqual(pendingArticles);
                expect(prisma.article.findMany).toHaveBeenCalledWith({
                    where: { status: 'EN_ATTENTE_ADMIN' },
                    orderBy: { createdAt: 'desc' },
                });
            });

            it('should reject non-admin roles', async () => {
                const response = await request(app)
                    .get('/api/admin/articles/pending')
                    .set('Authorization', `Bearer ${validToken}`);

                expect(response.status).toBe(403);
            });
        });

        describe('POST /admin/articles/:id/approve', () => {
            it('should approve the article when requested by admin', async () => {
                (prisma.$transaction as jest.Mock).mockResolvedValue([{}, {}]);

                const response = await request(app)
                    .post('/api/admin/articles/art-123/approve')
                    .set('Authorization', `Bearer ${adminToken}`);

                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Article approved');
                expect(prisma.$transaction).toHaveBeenCalled();
            });
        });

        describe('POST /admin/articles/:id/refuse', () => {
            it('should refuse the article when providing a reason', async () => {
                (prisma.$transaction as jest.Mock).mockResolvedValue([{}, {}]);

                const response = await request(app)
                    .post('/api/admin/articles/art-123/refuse')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ reason: 'Inappropriate content' });

                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Article refused');
                expect(prisma.$transaction).toHaveBeenCalled();
            });

            it('should return 400 if reason is missing', async () => {
                const response = await request(app)
                    .post('/api/admin/articles/art-123/refuse')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({});

                expect(response.status).toBe(400);
                expect(response.body.message).toBe('A rejection reason is required');
                expect(prisma.$transaction).not.toHaveBeenCalled(); // transaction should not happen
            });
        });
    });

    describe('Public Catalog API', () => {
        describe('GET /catalog', () => {
            it('should return paginated PUBLIE articles', async () => {
                const publishedArticles = [
                    { id: '1', status: 'PUBLIE', publishedAt: '2023-01-01T10:00:00Z' },
                    { id: '2', status: 'PUBLIE', publishedAt: '2023-01-02T10:00:00Z' },
                ];

                (prisma.$transaction as jest.Mock).mockResolvedValue([publishedArticles, 2]);

                const response = await request(app).get('/api/catalog?page=1&limit=10');

                expect(response.status).toBe(200);
                expect(response.body.items).toEqual(publishedArticles);
                expect(response.body.meta).toEqual(expect.objectContaining({
                    total: 2,
                    page: 1,
                    limit: 10,
                    totalPages: 1
                }));
                expect(prisma.$transaction).toHaveBeenCalled();
            });

            it('should use default pagination values if not provided', async () => {
                (prisma.$transaction as jest.Mock).mockResolvedValue([[], 0]);

                const response = await request(app).get('/api/catalog');

                expect(response.status).toBe(200);
                expect(prisma.$transaction).toHaveBeenCalled();
            });
        });
    });
});
