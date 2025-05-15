import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../../middleware/validation';
import { authenticate } from '../../middleware/auth';
import * as authController from './controllers';

const router = Router();

// Registration validation rules
const registerValidation = [
  body('email').isEmail().withMessage('Must be a valid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters long')
];

// Login validation rules
const loginValidation = [
  body('email').isEmail().withMessage('Must be a valid email address'),
  body('password').notEmpty().withMessage('Password is required')
];

// Profile update validation rules
const profileUpdateValidation = [
  body('full_name').optional(),
  body('bio').optional(),
  body('location').optional()
];

// Register a new user
router.post('/register', validate(registerValidation), authController.register);

// Login user
router.post('/login', validate(loginValidation), authController.login);

// Get current user profile
router.get('/me', authenticate, authController.getCurrentUser);

// Update user profile
router.put('/profile', authenticate, validate(profileUpdateValidation), authController.updateProfile);

// Reset password (request)
router.post('/reset-password', 
  [body('email').isEmail().withMessage('Must be a valid email address')],
  authController.requestPasswordReset
);

// Reset password (with token)
router.post('/reset-password/confirm',
  [
    body('token').notEmpty().withMessage('Token is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
  ],
  authController.confirmPasswordReset
);

export default router;