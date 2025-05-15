import { Request, Response, NextFunction } from 'express';
import { HttpError } from './errorHandler';
import supabase from '../services/supabase';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/**
 * Middleware to authenticate requests using Supabase JWT token
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HttpError(401, 'Authentication required');
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw new HttpError(401, 'Invalid token format');
    }
    
    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      throw new HttpError(401, 'Invalid or expired token');
    }
    
    // Set user in request
    req.user = user;
    
    next();
  } catch (error) {
    if (error instanceof HttpError) {
      next(error);
    } else {
      next(new HttpError(401, 'Authentication failed'));
    }
  }
};

/**
 * Middleware to check if user is an admin
 */
export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Authentication required');
    }
    
    // Get user profile to check admin status
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();
    
    if (error || !profile) {
      throw new HttpError(403, 'Access denied');
    }
    
    // Check if user has admin role
    if (profile.role !== 'admin') {
      throw new HttpError(403, 'Admin privileges required');
    }
    
    next();
  } catch (error) {
    if (error instanceof HttpError) {
      next(error);
    } else {
      next(new HttpError(403, 'Access denied'));
    }
  }
};

/**
 * Middleware to check if user is a group leader
 */
export const isGroupLeader = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Authentication required');
    }
    
    const groupId = req.params.groupId || req.body.groupId;
    
    if (!groupId) {
      throw new HttpError(400, 'Group ID is required');
    }
    
    // Check if user is a leader for this group
    const { data, error } = await supabase
      .from('group_leaders')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('group_id', groupId);
    
    if (error || !data || data.length === 0) {
      throw new HttpError(403, 'You must be a group leader to perform this action');
    }
    
    next();
  } catch (error) {
    if (error instanceof HttpError) {
      next(error);
    } else {
      next(new HttpError(403, 'Access denied'));
    }
  }
};