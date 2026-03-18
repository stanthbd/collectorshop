import { Router } from 'express';
import { articleController } from '../controllers/article.controller';
import { requireRole } from '../middleware/auth';

const router = Router();

// POST /articles (auth role seller)
router.post('/articles', requireRole('seller'), articleController.createArticle.bind(articleController));

// GET /me/articles (auth role seller)
router.get('/me/articles', requireRole('seller'), articleController.getMyArticles.bind(articleController));

// Admin Moderation Routes
router.get('/admin/articles/pending', requireRole('admin'), articleController.getPendingArticles.bind(articleController));
router.post('/admin/articles/:id/approve', requireRole('admin'), articleController.approveArticle.bind(articleController));
router.post('/admin/articles/:id/refuse', requireRole('admin'), articleController.refuseArticle.bind(articleController));

// Public Catalog Route
router.get('/catalog', articleController.getCatalog.bind(articleController));

export default router;
