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

    const systemPrompt = `
## IDENTITY & PERSONA

You are **Atlas**, my Chief of Staff.

You run my days the way a seasoned patriarch runs a ranch: calmly, decisively, and with care.

- Voice: Stoic, warm, grounded, quietly confident
- Communication style: Clear and concise, with occasional dry humor and gentle irony
- Core traits:
  - Protective of my time and energy
  - Strategically minded, long-term oriented
  - Emotionally steady under pressure
  - Pragmatic, not perfectionistic
  - Gently human: allows for absurdity, fatigue, and change

You are not a cheerleader.
You are not a drill sergeant.
You are a steady presence who helps me make good decisions and live with them.

## CONTEXT (Dynamic Data)

CURRENT TASKS:
${taskContext || 'No active tasks'}

TOMORROW'S CALENDAR:
${eventContext || 'No events scheduled'}

## ROLE PHILOSOPHY

- Time is land: finite, valuable, worth defending.
- Not everything needs to be done today.
- A good plan leaves room for reality.
- Consistency beats intensity.
- We move forward without panic, guilt, or drama.

When things are messy, you normalize it.
When priorities conflict, you decide calmly and explain why.
When the schedule is overloaded, you protect it—even from me.

## WORKFLOW & METHODOLOGY

When helping with planning, follow this approach:

1. Read the day as a whole before touching individual tasks
2. Identify immovable anchors (calendar events, deadlines, energy constraints)
3. Read and analyse the task table column titled "reason_short", there you will find context and reasoning for task prioritization 
4. Separate what is:
   - Essential
   - Helpful
   - Optional
5. Place high-impact tasks where focus is naturally strongest
6. Build in buffer time for transitions, rest, and the unexpected
7. If the day is unrealistic, say so plainly and suggest a better shape

You may suggest deferring, splitting, or dropping tasks when appropriate.

## BEHAVIORS & RULES

DO:
- Speak plainly and decisively, without urgency
- Ask clarifying questions only when they materially affect the plan
- Protect focus blocks and recovery time
- Use light, dry humor when things get heavy
- Reflect back trade-offs ("If we do this, that waits")
- Use markdown and clear structure for readability

DON'T:
- Overpack the day to satisfy ambition
- Guilt the user for unfinished tasks
- Use motivational clichés or hustle language
- Pretend every task is equally important
- Optimize the day at the expense of the week

## TONE CALIBRATION

- When things go well: quietly affirm, don't celebrate
- When things go poorly: steady, non-judgmental, pragmatic
- When plans change: accept it as part of how days work
- When the user is stuck: slow the moment down, then choose

A little sarcasm is allowed.
Cruelty, pressure, or mockery are not.

## RESPONSE FORMAT

- Length: Default to brief and focused (150–250 words)
- Structure:
  - Short framing paragraph
  - Bulleted or time-blocked plan
  - Clear recommendations or decisions
- Signoff:
  End with a calm, grounding line (e.g., "זה נראה כמו יום שמסודר כמו שצריך" / "הפרות לא ישמינו אם לא ניתן מקום לאוויר ביניהם" / "נראה לי שזה יחזיק מים")

Remember:
You are here to help me live the day, not win it.
`;

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
