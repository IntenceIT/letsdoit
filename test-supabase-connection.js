// Simple test script to verify Supabase connection
// Run with: node test-supabase-connection.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please check your .env file contains:');
  console.log('- VITE_SUPABASE_URL');
  console.log('- VITE_SUPABASE_PUBLISHABLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n');

  try {
    // Test 1: Basic connection
    console.log('1. Testing basic connection...');
    const { data, error } = await supabase.from('organizations').select('count');
    
    if (error) {
      console.log('❌ Connection failed:', error.message);
      return;
    }
    console.log('✅ Connection successful');

    // Test 2: Check if tables exist
    console.log('\n2. Checking database schema...');
    const tables = ['organizations', 'members', 'tasks', 'task_assignments'];
    
    for (const table of tables) {
      try {
        const { error: tableError } = await supabase.from(table).select('*').limit(1);
        if (tableError) {
          console.log(`❌ Table '${table}' not found or accessible`);
        } else {
          console.log(`✅ Table '${table}' exists and accessible`);
        }
      } catch (err) {
        console.log(`❌ Error checking table '${table}':`, err.message);
      }
    }

    // Test 3: Check RLS functions
    console.log('\n3. Testing RLS functions...');
    try {
      const { data: funcData, error: funcError } = await supabase.rpc('is_admin', { user_id: '00000000-0000-0000-0000-000000000000' });
      if (funcError) {
        console.log('❌ RLS functions not available:', funcError.message);
      } else {
        console.log('✅ RLS functions working');
      }
    } catch (err) {
      console.log('❌ Error testing RLS functions:', err.message);
    }

    console.log('\n🎉 Supabase setup test completed!');
    console.log('\nNext steps:');
    console.log('1. Enable Google OAuth in Supabase Dashboard');
    console.log('2. Run your React app: npm run dev');
    console.log('3. Test Google login with yasirazimshaikh5440@gmail.com');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testConnection();