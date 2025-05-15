import { Router } from 'express';
import { body, query, param } from 'express-validator';
import { validate } from '../../middleware/validation';
import { authenticate, isAdmin, isGroupLeader } from '../../middleware/auth';
import * as groupController from './controllers';

const router = Router();

// Group creation validation rules
const groupValidation = [
  body('name').notEmpty().withMessage('Group name is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('city').notEmpty().withMessage('City is required'),
  body('state').notEmpty().withMessage('State is required'),
  body('zip').notEmpty().withMessage('ZIP code is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').optional(),
  body('website').optional().isURL().withMessage('Website must be a valid URL'),
  body('address').optional(),
  body('location').optional()
];

// Search validation
const searchValidation = [
  query('city').optional(),
  query('state').optional(),
  query('keywords').optional(),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

// Public routes
// Search for groups
router.get('/', validate(searchValidation), groupController.searchGroups);

// Get a single group by ID
router.get('/:id', 
  param('id').notEmpty().withMessage('Group ID is required'),
  groupController.getGroupById
);

// Protected routes (require authentication)
// Create a new group
router.post('/', 
  authenticate, 
  validate(groupValidation), 
  groupController.createGroup
);

// Update a group (requires group leader or admin)
router.put('/:id', 
  authenticate,
  param('id').notEmpty().withMessage('Group ID is required'),
  validate(groupValidation), 
  isGroupLeader,
  groupController.updateGroup
);

// Delete a group (requires group leader or admin)
router.delete('/:id', 
  authenticate,
  param('id').notEmpty().withMessage('Group ID is required'),
  isGroupLeader, 
  groupController.deleteGroup
);

// Add a leader to a group (requires existing group leader or admin)
router.post('/:id/leaders', 
  authenticate,
  param('id').notEmpty().withMessage('Group ID is required'),
  body('userId').notEmpty().withMessage('User ID is required'),
  body('role').optional(),
  isGroupLeader, 
  groupController.addGroupLeader
);

// Remove a leader from a group (requires existing group leader or admin)
router.delete('/:id/leaders/:userId', 
  authenticate,
  param('id').notEmpty().withMessage('Group ID is required'),
  param('userId').notEmpty().withMessage('User ID is required'),
  isGroupLeader, 
  groupController.removeGroupLeader
);

// Admin-only routes
// Approve a group
router.post('/:id/approve', 
  authenticate,
  param('id').notEmpty().withMessage('Group ID is required'),
  isAdmin, 
  groupController.approveGroup
);

// Get pending groups
router.get('/admin/pending', 
  authenticate,
  isAdmin, 
  groupController.getPendingGroups
);

export default router;