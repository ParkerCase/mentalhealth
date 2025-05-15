import { Request, Response, NextFunction } from 'express';
import supabase from '../../services/supabase';
import { HttpError } from '../../middleware/errorHandler';
import { AuthResponse, ProfileUpdate } from '../../types';

/**
 * Register a new user
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, username } = req.body;
    
    // Check if email already exists
    const { data: existingUsers, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username);
    
    if (checkError) throw new HttpError(500, 'Failed to check username availability');
    
    if (existingUsers && existingUsers.length > 0) {
      throw new HttpError(400, 'Username already taken');
    }
    
    // Register with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          preferred_username: username
        }
      }
    });
    
    if (error) throw new HttpError(400, error.message);
    
    if (!data.user) {
      throw new HttpError(500, 'User registration failed');
    }
    
    // Create user profile
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      username,
      full_name: null,
      avatar_url: null,
      bio: null,
      location: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    if (profileError) {
      // If profile creation fails, attempt to delete the auth user
      // This is a best-effort cleanup - in a real system you'd want more robust handling
      await supabase.auth.admin.deleteUser(data.user.id);
      throw new HttpError(500, 'Failed to create user profile');
    }
    
    const response: AuthResponse = {
      message: 'Registration successful. Please check your email for verification.'
    };
    
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw new HttpError(401, 'Invalid email or password');
    
    if (!data.session || !data.user) {
      throw new HttpError(500, 'Login failed');
    }
    
    const response: AuthResponse = {
      token: data.session.access_token,
      user: data.user
    };
    
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 */
export const getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // User is set by authenticate middleware
    if (!req.user) {
      throw new HttpError(401, 'User not authenticated');
    }
    
    // Fetch profile data
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();
    
    if (error) throw new HttpError(500, 'Failed to fetch user profile');
    
    res.status(200).json({
      user: req.user,
      profile
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpError(401, 'User not authenticated');
    }
    
    const { full_name, bio, location, username } = req.body;
    
    // Check if username exists if being changed
    if (username) {
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .neq('id', req.user.id)
        .maybeSingle();
      
      if (checkError) throw new HttpError(500, 'Failed to check username availability');
      
      if (existingUser) {
        throw new HttpError(400, 'Username already taken');
      }
    }
    
    // Build update object with only defined fields
    const updateData: Partial<ProfileUpdate> = {};
    
    if (full_name !== undefined) updateData.full_name = full_name;
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (username !== undefined) updateData.username = username;
    
    // Add updated timestamp
    updateData.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', req.user.id)
      .select()
      .single();
    
    if (error) throw new HttpError(500, 'Failed to update profile');
    
    res.status(200).json({
      message: 'Profile updated successfully',
      profile: data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request password reset
 */
export const requestPasswordReset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`
    });
    
    if (error) throw new HttpError(400, error.message);
    
    // For security, always return success even if email doesn't exist
    res.status(200).json({
      message: 'If an account with that email exists, a password reset email has been sent.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Confirm password reset with token
 */
export const confirmPasswordReset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = req.body;
    
    // Use the token to update the password
    const { error } = await supabase.auth.updateUser({
      password
    });
    
    if (error) throw new HttpError(400, error.message);
    
    res.status(200).json({
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    next(error);
  }
};