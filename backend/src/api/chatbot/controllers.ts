// backend/src/api/chatbot/controllers.ts
import { Request, Response, NextFunction } from 'express';
import chatbotService from '../../services/chatbot';
import { HttpError } from '../../middleware/errorHandler';

/**
 * Process a message from an anonymous user
 */
export const processMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      throw new HttpError(400, 'Message is required');
    }
    
    const response = await chatbotService.processMessage(message);
    
    res.status(200).json({
      response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Process a message from an authenticated user
 */
export const processAuthenticatedMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Authentication required');
    }
    
    const { message } = req.body;
    
    if (!message) {
      throw new HttpError(400, 'Message is required');
    }
    
    const response = await chatbotService.processMessage(message, req.user.id);
    
    res.status(200).json({
      response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};