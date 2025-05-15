import { Request, Response, NextFunction } from 'express';
import supabase from '../../services/supabase';
import { HttpError } from '../../middleware/errorHandler';
import { AdminStats, ArticleInsert } from '../../types';

/**
 * Get dashboard statistics
 */
export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Authentication required');
    }
    
    // Get total groups count
    const { count: totalGroups, error: groupsError } = await supabase
      .from('groups')
      .select('*', { count: 'exact', head: true });
    
    // Get pending groups count
    const { count: pendingGroups, error: pendingError } = await supabase
      .from('groups')
      .select('*', { count: 'exact', head: true })
      .eq('approved', false);
    
    // Get total users count
    const { count: totalUsers, error: usersError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    // Get total messages count
    const { count: totalMessages, error: messagesError } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true });
    
    // Get total contact submissions
    const { count: totalContacts, error: contactsError } = await supabase
      .from('contact_submissions')
      .select('*', { count: 'exact', head: true });
    
    if (groupsError || pendingError || usersError || messagesError || contactsError) {
      throw new HttpError(500, 'Error fetching statistics');
    }
    
    const stats: AdminStats = {
      totalGroups: totalGroups || 0,
      pendingGroups: pendingGroups || 0,
      totalUsers: totalUsers || 0,
      totalMessages: totalMessages || 0,
      totalContacts: totalContacts || 0
    };
    
    res.status(200).json({ stats });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all groups with pagination
 */
export const getAllGroups = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Authentication required');
    }
    
    const { page = 1, limit = 20, approved } = req.query;
    const from = (Number(page) - 1) * Number(limit);
    const to = from + Number(limit) - 1;
    
    let query = supabase
      .from('groups')
      .select('*', { count: 'exact' });
    
    // Filter by approval status if provided
    if (approved !== undefined) {
      query = query.eq('approved', approved === 'true');
    }
    
    // Apply pagination
    query = query.range(from, to).order('created_at', { ascending: false });
    
    const { data, error, count } = await query;
    
    if (error) throw new HttpError(500, 'Error fetching groups');
    
    res.status(200).json({
      groups: data || [],
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        pages: count ? Math.ceil(count / Number(limit)) : 0
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get pending groups
 */
export const getPendingGroups = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Authentication required');
    }
    
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('approved', false)
      .order('created_at', { ascending: false });
    
    if (error) throw new HttpError(500, 'Error fetching pending groups');
    
    res.status(200).json({
      groups: data || []
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve a group
 */
export const approveGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Authentication required');
    }
    
    const { id } = req.params;
    
    // Update the group
    const { data, error } = await supabase
      .from('groups')
      .update({
        approved: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new HttpError(500, 'Failed to approve group');
    
    res.status(200).json({
      message: 'Group approved successfully',
      group: data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject a group
 */
export const rejectGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Authentication required');
    }
    
    const { id } = req.params;
    
    // Delete the group
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', id);
    
    if (error) throw new HttpError(500, 'Failed to reject group');
    
    res.status(200).json({
      message: 'Group rejected and deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users with pagination
 */
export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Authentication required');
    }
    
    const { page = 1, limit = 20, search } = req.query;
    const from = (Number(page) - 1) * Number(limit);
    const to = from + Number(limit) - 1;
    
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' });
    
    // Apply search filter if provided
    if (search) {
      query = query.or(`username.ilike.%${search}%,full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    
    // Apply pagination
    query = query.range(from, to).order('created_at', { ascending: false });
    
    const { data, error, count } = await query;
    
    if (error) throw new HttpError(500, 'Error fetching users');
    
    res.status(200).json({
      users: data || [],
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        pages: count ? Math.ceil(count / Number(limit)) : 0
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user role
 */
export const updateUserRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Authentication required');
    }
    
    const { id } = req.params;
    const { role } = req.body;
    
    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (userError || !user) {
      throw new HttpError(404, 'User not found');
    }
    
    // Update the user's role
    const { data, error } = await supabase
      .from('profiles')
      .update({
        role,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new HttpError(500, 'Failed to update user role');
    
    res.status(200).json({
      message: 'User role updated successfully',
      user: data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get contact submissions
 */
export const getContactSubmissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Authentication required');
    }
    
    const { page = 1, limit = 20, status } = req.query;
    const from = (Number(page) - 1) * Number(limit);
    const to = from + Number(limit) - 1;
    
    let query = supabase
      .from('contact_submissions')
      .select('*', { count: 'exact' });
    
    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }
    
    // Apply pagination
    query = query.range(from, to).order('created_at', { ascending: false });
    
    const { data, error, count } = await query;
    
    if (error) throw new HttpError(500, 'Error fetching contact submissions');
    
    res.status(200).json({
      submissions: data || [],
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        pages: count ? Math.ceil(count / Number(limit)) : 0
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update contact submission status
 */
export const updateContactStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Authentication required');
    }
    
    const { id } = req.params;
    const { status } = req.body;
    
    // Update the status
    const { data, error } = await supabase
      .from('contact_submissions')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new HttpError(500, 'Failed to update submission status');
    
    res.status(200).json({
      message: 'Submission status updated successfully',
      submission: data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all articles
 */
export const getAllArticles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Authentication required');
    }
    
    const { page = 1, limit = 20, published } = req.query;
    const from = (Number(page) - 1) * Number(limit);
    const to = from + Number(limit) - 1;
    
    let query = supabase
      .from('archives')
      .select('*', { count: 'exact' });
    
    // Filter by published status if provided
    if (published !== undefined) {
      query = query.eq('published', published === 'true');
    }
    
    // Apply pagination
    query = query.range(from, to).order('created_at', { ascending: false });
    
    const { data, error, count } = await query;
    
    if (error) throw new HttpError(500, 'Error fetching articles');
    
    res.status(200).json({
      articles: data || [],
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        pages: count ? Math.ceil(count / Number(limit)) : 0
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create an article
 */
export const createArticle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Authentication required');
    }
    
    const {
      title,
      content,
      category,
      tags,
      published = false,
      featured = false,
      thumbnail_url
    } = req.body;
    
    const articleData: ArticleInsert = {
      title,
      content,
      category,
      tags,
      published,
      featured,
      thumbnail_url,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Create the article
    const { data, error } = await supabase
      .from('archives')
      .insert(articleData)
      .select()
      .single();
    
    if (error) throw new HttpError(500, 'Failed to create article');
    
    res.status(201).json({
      message: 'Article created successfully',
      article: data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an article
 */
export const updateArticle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Authentication required');
    }
    
    const { id } = req.params;
    const {
      title,
      content,
      category,
      tags,
      published,
      featured,
      thumbnail_url
    } = req.body;
    
    // Create update object with only defined fields
    const updateData: Partial<ArticleInsert> = {};
    
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (category !== undefined) updateData.category = category;
    if (tags !== undefined) updateData.tags = tags;
    if (published !== undefined) updateData.published = published;
    if (featured !== undefined) updateData.featured = featured;
    if (thumbnail_url !== undefined) updateData.thumbnail_url = thumbnail_url;
    
    // Add updated timestamp
    updateData.updated_at = new Date().toISOString();
    
    // Update the article
    const { data, error } = await supabase
      .from('archives')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new HttpError(500, 'Failed to update article');
    
    res.status(200).json({
      message: 'Article updated successfully',
      article: data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an article
 */
export const deleteArticle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Authentication required');
    }
    
    const { id } = req.params;
    
    // Delete the article
    const { error } = await supabase
      .from('archives')
      .delete()
      .eq('id', id);
    
    if (error) throw new HttpError(500, 'Failed to delete article');
    
    res.status(200).json({
      message: 'Article deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};