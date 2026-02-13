
import { createClient } from '@supabase/supabase-js'

// We will try to load from localStorage first for dynamic configuration
const storedSettings = JSON.parse(localStorage.getItem("nx-settings") || "{}");

const supabaseUrl = storedSettings.supabaseUrl || import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = storedSettings.supabaseKey || import.meta.env.VITE_SUPABASE_KEY;

// Create a single supabase client for interacting with your database
export const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null;
