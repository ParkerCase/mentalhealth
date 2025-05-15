import { Request, Response, NextFunction } from 'express';
import supabase from '../../services/supabase';
import { HttpError } from '../../middleware/errorHandler';
import { GroupInsert, GroupSearchParams } from '../../types';
import { geocodeAddress } from '../../services/geocoding';

/**
 * Search for groups
 */
export const searchGroups = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { city, state, keywords, page = 1, limit = 20 } = req.query as unknown as GroupSearchParams;
    
    // Start building query
    let query = supabase
      .from('groups')
      .select('*')
      .eq('approved', true);
    
    // Apply filters
    if (city) {
      query = query.ilike('city', `%${city}%`);
    }
    
    if (state) {
      query = query.ilike('state', `%${state}%`);
    }
    
    if (keywords) {
      query = query.or(`name.ilike.%${keywords}%,description.ilike.%${keywords}%`);
    }
    
    // Calculate pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    // Get data with pagination
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)
      .select('*', { count: 'exact' });
    
    if (error) throw new HttpError(500, 'Error searching groups');
    
    res.status(200).json({
      groups: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: count ? Math.ceil(count / limit) : 0
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single group by ID
 */
export const getGroupById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // Get group with leaders
    const { data, error } = await supabase
      .from('groups')
      .select(`
        *,
        group_leaders (
          id,
          role,
          user_id,
          profiles (
            id,
            username,
            full_name,
            avatar_url,
            email
          )
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw new HttpError(404, 'Group not found');
    
    res.status(200).json({ group: data });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new group
 */
export const createGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Authentication required');
    }
    
    const groupData: GroupInsert = {
      name: req.body.name,
      description: req.body.description,
      location: req.body.location,
      address: req.body.address,
      city: req.body.city,
      state: req.body.state,
      zip: req.body.zip,
      website: req.body.website,
      email: req.body.email,
      phone: req.body.phone,
      approved: false, // Groups require approval
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Geocode the address if provided
    if (groupData.address && groupData.city && groupData.state) {
      try {
        const fullAddress = `${groupData.address}, ${groupData.city}, ${groupData.state} ${groupData.zip}`;
        const results = await geocodeAddress(fullAddress);
        
        if (results && results.length > 0) {
          groupData.geo_location = {
            type: 'Point',
            coordinates: [results[0].lng, results[0].lat]
          };
        }
      } catch (error) {
        console.error('Geocoding error:', error);
        // Continue without geocoding
      }
    }
    
    // Insert group
    const { data, error } = await supabase
      .from('groups')
      .insert(groupData)
      .select()
      .single();
    
    if (error) throw new HttpError(500, 'Failed to create group');
    
    // Add creator as group leader
    const { error: leaderError } = await supabase
      .from('group_leaders')
      .insert({
        group_id: data.id,
        user_id: req.user.id,
        role: 'founder',
        created_at: new Date().toISOString()
      });
    
    if (leaderError) {
      console.error('Error adding group leader:', leaderError);
      // Continue even if there's an error adding the leader
    }
    
    res.status(201).json({
      message: 'Group created successfully and awaiting approval',
      group: data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a group
 */
export const updateGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    if (!req.user) {
      throw new HttpError(401, 'Authentication required');
    }
    
    // Check if group exists
    const { data: existingGroup, error: fetchError } = await supabase
      .from('groups')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !existingGroup) {
      throw new HttpError(404, 'Group not found');
    }
    
    const groupData: Partial<GroupInsert> = {
      name: req.body.name,
      description: req.body.description,
      location: req.body.location,
      address: req.body.address,
      city: req.body.city,
      state: req.body.state,
      zip: req.body.zip,
      website: req.body.website,
      email: req.body.email,
      phone: req.body.phone,
      updated_at: new Date().toISOString()
    };
    
    // Geocode the address if it has changed
    if (
      groupData.address !== existingGroup.address ||
      groupData.city !== existingGroup.city ||
      groupData.state !== existingGroup.state ||
      groupData.zip !== existingGroup.zip
    ) {
      try {
        const fullAddress = `${groupData.address}, ${groupData.city}, ${groupData.state} ${groupData.zip}`;
        const results = await geocodeAddress(fullAddress);
        
        if (results && results.length > 0) {
          groupData.geo_location = {
            type: 'Point',
            coordinates: [results[0].lng, results[0].lat]
          };
        }
      } catch (error) {
        console.error('Geocoding error:', error);
        // Continue without geocoding
      }
    }
    
    // Update group
    const { data, error } = await supabase
      .from('groups')
      .update(groupData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new HttpError(500, 'Failed to update group');
    
    res.status(200).json({
      message: 'Group updated successfully',
      group: data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a group
 */
export const deleteGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    if (!req.user) {
      throw new HttpError(401, 'Authentication required');
    }
    
    // Check if group exists
    const { data: existingGroup, error: fetchError } = await supabase
      .from('groups')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !existingGroup) {
      throw new HttpError(404, 'Group not found');
    }
    
    // Delete group
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', id);
    
    if (error) throw new HttpError(500, 'Failed to delete group');
    
    res.status(200).json({
      message: 'Group deleted successfully'
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
    const { id } = req.params;
    
    if (!req.user) {
      throw new HttpError(401, 'Authentication required');
    }
    
    // Update group approval status
    const { data, error } = await supabase
      .from('groups')
      .update({ approved: true, updated_at: new Date().toISOString() })
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
 * Add a group leader
 */
export const addGroupLeader = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { userId, role = 'leader' } = req.body;
    
    if (!req.user) {
      throw new HttpError(401, 'Authentication required');
    }
    
    // Check if the user exists
    const { data: userExists, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (userError || !userExists) {
      throw new HttpError(404, 'User not found');
    }
    
    // Check if already a leader
    const { data: existingLeader, error: leaderError } = await supabase
      .from('group_leaders')
      .select('*')
      .eq('group_id', id)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (existingLeader) {
      throw new HttpError(400, 'User is already a leader for this group');
    }
    
    // Add as leader
    const { data, error } = await supabase
      .from('group_leaders')
      .insert({
        group_id: id,
        user_id: userId,
        role,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw new HttpError(500, 'Failed to add group leader');
    
    res.status(201).json({
      message: 'Group leader added successfully',
      leader: data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove a group leader
 */
export const removeGroupLeader = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, userId } = req.params;
    
    if (!req.user) {
      throw new HttpError(401, 'Authentication required');
    }
    
    // Check if more than one leader exists
    const { data: leaders, error: countError } = await supabase
      .from('group_leaders')
      .select('*')
      .eq('group_id', id);
    
    if (countError) throw new HttpError(500, 'Failed to check group leaders');
    
    if (!leaders || leaders.length <= 1) {
      throw new HttpError(400, 'Cannot remove the last group leader');
    }
    
    // Remove leader
    const { error } = await supabase
      .from('group_leaders')
      .delete()
      .eq('group_id', id)
      .eq('user_id', userId);
    
    if (error) throw new HttpError(500, 'Failed to remove group leader');
    
    res.status(200).json({
      message: 'Group leader removed successfully'
    });
  } catch (error) {
    next(error);
  }
};