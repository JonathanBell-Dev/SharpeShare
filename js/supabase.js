// js/supabase.js
// This file connects your website to your Supabase database

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Replace these two lines with YOUR project info
const SUPABASE_URL = 'https://kmmuqinltebcvwugravz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttbXVxaW5sdGViY3Z3dWdyYXZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MjA1NDcsImV4cCI6MjA3NzQ5NjU0N30.VtfisG7G8TBa42lzYn1CEvVeFTIdLD53caXfPSAbAGQ';

// This creates the connection
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
