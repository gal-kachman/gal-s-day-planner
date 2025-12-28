import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schemas
const ScheduleItemSchema = z.object({
  title: z.string().min(1).max(200),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).nullable().optional(),
  itemType: z.enum(['task', 'event', 'break']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).nullable().optional(),
  location: z.string().max(200).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

const SaveScheduleSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  items: z.array(ScheduleItemSchema).max(100),
  summary: z.string().max(500).nullable().optional(),
});

// Validate authentication
async function validateAuth(req: Request): Promise<{ userId: string | null; error: string | null }> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { userId: null, error: 'Missing or invalid authorization header' };
  }
  
  const token = authHeader.replace('Bearer ', '');
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return { userId: null, error: 'Invalid or expired token' };
  }
  
  return { userId: user.id, error: null };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const { userId, error: authError } = await validateAuth(req);
    if (authError) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate input
    const rawBody = await req.json();
    const parseResult = SaveScheduleSchema.safeParse(rawBody);
    
    if (!parseResult.success) {
      console.error('Validation failed:', parseResult.error.errors);
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: parseResult.error.errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { date, items, summary } = parseResult.data;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`User ${userId} saving schedule for date: ${date} with ${items.length} items`);

    // Create scheduled_day record
    const { data: scheduledDay, error: dayError } = await supabase
      .from('scheduled_days')
      .insert({
        date,
        conversation_summary: summary || null,
      })
      .select()
      .single();

    if (dayError) {
      console.error('Error creating scheduled_day:', dayError);
      throw new Error(`Failed to create scheduled day: ${dayError.message}`);
    }

    console.log('Created scheduled_day:', scheduledDay.id);

    // Insert all items
    const itemsToInsert = items.map((item, index: number) => ({
      scheduled_day_id: scheduledDay.id,
      title: item.title,
      start_time: item.startTime,
      end_time: item.endTime || null,
      item_type: item.itemType,
      priority: item.priority || null,
      location: item.location || null,
      notes: item.notes || null,
      is_done: false,
      order_index: index,
    }));

    const { error: itemsError } = await supabase
      .from('scheduled_items')
      .insert(itemsToInsert);

    if (itemsError) {
      console.error('Error inserting items:', itemsError);
      throw new Error(`Failed to save schedule items: ${itemsError.message}`);
    }

    console.log(`Successfully saved ${items.length} items`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        scheduledDayId: scheduledDay.id,
        date: scheduledDay.date
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in save-schedule function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
