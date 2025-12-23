import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { date, items, summary } = await req.json();

    if (!date || !items || !Array.isArray(items)) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: date and items' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Saving schedule for date: ${date} with ${items.length} items`);

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
    const itemsToInsert = items.map((item: any, index: number) => ({
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
