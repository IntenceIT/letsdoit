import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Cleanup old assignments (30+ days)
    const { error: cleanupError } = await supabaseAdmin.rpc('cleanup_old_assignments')
    
    // Reset daily tasks
    const { error: resetError } = await supabaseAdmin.rpc('reset_daily_tasks')

    if (cleanupError || resetError) {
      throw new Error(cleanupError?.message || resetError?.message)
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Daily cleanup completed' }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})