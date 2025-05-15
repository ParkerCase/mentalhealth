import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { validate } from '../../middleware/validation';
import { authenticate } from '../../middleware/auth';
import * as messageController from './controllers';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get conversations
router.get('/conversations', messageController.getConversations);

// Get conversation by ID
router.get('/conversations/:id', 
  param('id').notEmpty().withMessage('Conversation ID is required'),
  messageController.getConversationById
);

// Create a new conversation
router.post('/conversations', 
  body('groupId').notEmpty().withMessage('Group ID is required'),
  validate([body('groupId')]), 
  messageController.createConversation
);

// Get messages for a conversation
router.get('/conversations/:id/messages', 
  param('id').notEmpty().withMessage('Conversation ID is required'),
  messageController.getConversationMessages
);

// Send a message
router.post('/messages', 
  [
    body('content').notEmpty().withMessage('Message content is required'),
    body('conversationId').optional(),
    body('groupId').optional(),
    body('recipientId').optional()
  ],
  validate([body('content')]),
  messageController.sendMessage
);

// Mark messages as read
router.put('/messages/read', 
  body('messageIds').isArray().withMessage('Message IDs must be an array'),
  validate([body('messageIds')]), 
  messageController.markMessagesAsRead
);

// Get unread message count
router.get('/unread-count', messageController.getUnreadCount);

// Delete a message
router.delete('/messages/:id', 
  param('id').notEmpty().withMessage('Message ID is required'),
  messageController.deleteMessage
);

export default router;