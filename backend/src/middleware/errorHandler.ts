import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../types';

export class HttpError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(status: number, message: string, errors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.errors = errors;
    this.name = 'HttpError';
  }
}

export const errorHandler = (
  err: Error | HttpError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err.stack);

  if (err instanceof HttpError) {
    const response: ApiError = {
      status: err.status,
      message: err.message
    };
    
    if (err.errors) {
      response.errors = err.errors;
    }
    
    return res.status(err.status).json(response);
  }

  // For unhandled errors, return 500
  res.status(500).json({
    status: 500,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
};