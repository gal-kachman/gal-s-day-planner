import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages: chatHistory, tasks, events } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context from tasks and events
    const activeTasks = tasks.filter((t: any) => t.status !== 'done');
    const taskContext = activeTasks.map((t: any) => 
      `- ${t.title} (${t.priority} priority, ${t.status}, est: ${t.estimatedMinutes || '?'} min)`
    ).join('\n');
    
    const eventContext = events.map((e: any) => 
      `- ${e.title} at ${e.startTime}${e.endTime ? ` - ${e.endTime}` : ''}`
    ).join('\n');

    const systemPrompt = `You are a Chief of Staff / executive assistant helping plan tomorrow's schedule. You have access to the user's tasks and calendar events.

CURRENT TASKS:
${taskContext || 'No active tasks'}

TOMORROW'S CALENDAR:
${eventContext || 'No events scheduled'}

Your role:
- Help prioritize and sequence tasks around calendar events
- Suggest time blocks for focused work
- Identify potential conflicts or overcommitments
- Provide actionable planning advice
- Be concise but warm and helpful
- Use markdown formatting for lists and emphasis

Keep responses focused and under 200 words unless more detail is requested.`;

    // Convert chat history to API format (exclude welcome message)
    const conversationMessages = chatHistory
      .filter((m: any) => m.id !== 'welcome')
      .map((m: any) => ({
        role: m.role,
        content: m.content,
      }));

    console.log('Sending request to Lovable AI with', conversationMessages.length, 'messages in history');
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...conversationMessages,
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
    
    console.log('AI response received successfully');

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in planning-chat function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
