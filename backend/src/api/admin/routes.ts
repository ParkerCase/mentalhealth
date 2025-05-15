import { Router } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../../middleware/validation';
import { authenticate, isAdmin } from '../../middleware/auth';
import * as adminController from './controllers';

const router = Router();

// All routes require authentication and admin privileges
router.use(authenticate, isAdmin);

// Get admin dashboard stats
router.get('/stats', adminController.getDashboardStats);

// Get all groups (with pagination)
router.get('/groups', adminController.getAllGroups);

// Get pending groups
router.get('/groups/pending', adminController.getPendingGroups);

// Approve a group
router.post('/groups/:id/approve', 
  param('id').notEmpty().withMessage('Group ID is required'),
  adminController.approveGroup
);

// Reject a group
router.post('/groups/:id/reject', 
  param('id').notEmpty().withMessage('Group ID is required'),
  adminController.rejectGroup
);

// Get all users (with pagination)
router.get('/users', adminController.getAllUsers);

// Update user role
router.put('/users/:id/role',
  param('id').notEmpty().withMessage('User ID is required'),
  body('role').notEmpty().withMessage('Role is required'),
  validate([body('role')]),
  adminController.updateUserRole
);

// Get contact submissions
router.get('/contacts', adminController.getContactSubmissions);

// Update contact submission status
router.put('/contacts/:id/status',
  param('id').notEmpty().withMessage('Submission ID is required'),
  body('status').notEmpty().withMessage('Status is required'),
  validate([body('status')]),
  adminController.updateContactStatus
);

// Get all articles
router.get('/articles', adminController.getAllArticles);

// Create article
router.post('/articles',
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('content').notEmpty().withMessage('Content is required'),
    body('category').optional(),
    body('tags').optional().isArray(),
    body('published').optional().isBoolean(),
    body('featured').optional().isBoolean(),
    body('thumbnail_url').optional()
  ],
  validate([body('title'), body('content')]),
  adminController.createArticle
);

// Update article
router.put('/articles/:id',
  param('id').notEmpty().withMessage('Article ID is required'),
  adminController.updateArticle
);

// Delete article
router.delete('/articles/:id',
  param('id').notEmpty().withMessage('Article ID is required'),
  adminController.deleteArticle
);

export default router;