import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { Database } from '../types/database';

dotenv.config();

// Check for required environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with service key for admin privileges
const supabase = createClient<Database>(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default supabase;