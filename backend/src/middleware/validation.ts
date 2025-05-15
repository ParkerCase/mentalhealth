import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { HttpError } from './errorHandler';

/**
 * Middleware to validate request data using express-validator
 */
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));
    
    // Get validation errors
    const errors = validationResult(req);
    
    if (errors.isEmpty()) {
      return next();
    }
    
    // Format errors for response
    const formattedErrors: Record<string, string[]> = {};
    
    errors.array().forEach(error => {
      const field = error.path;
      if (!formattedErrors[field]) {
        formattedErrors[field] = [];
      }
      formattedErrors[field].push(error.msg);
    });
    
    next(new HttpError(400, 'Validation error', formattedErrors));
  };
};