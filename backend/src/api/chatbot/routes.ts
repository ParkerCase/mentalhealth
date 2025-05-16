// backend/src/api/chatbot/routes.ts
import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../../middleware/validation';
import { authenticate } from '../../middleware/auth';
import * as chatbotController from './controllers';

const router = Router();

// Public chatbot endpoint (no authentication required)
router.post('/message', 
  body('message').notEmpty().withMessage('Message is required'),
  validate([body('message')]),
  chatbotController.processMessage
);

// Authenticated chatbot endpoint (for logged-in users)
router.post('/conversation', 
  authenticate,
  body('message').notEmpty().withMessage('Message is required'),
  validate([body('message')]),
  chatbotController.processAuthenticatedMessage
);

export default router;