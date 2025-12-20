import { useState, useRef, useEffect } from 'react';
import { ChatMessage, Task, CalendarEvent, TimeBlock } from '@/types';
import { Send, Sparkles, Calendar, ListTodo } from 'lucide-react';
import { cn } from '@/lib/utils';
import botanicalCorner from '@/assets/botanical-corner.png';

interface ChatPanelProps {
  tasks: Task[];
  events: CalendarEvent[];
  quickPrompts: string[];
}

// Simple AI response generator (mock for now - will be replaced with Lovable AI)
function generateAIResponse(
  userMessage: string,
  tasks: Task[],
  events: CalendarEvent[]
): { content: string; schedule?: TimeBlock[] } {
  const activeTasks = tasks.filter((t) => t.status !== 'done');
  const urgentTasks = activeTasks.filter((t) => t.priority === 'urgent' || t.priority === 'high');
  const timedEvents = events.filter((e) => !e.isAllDay);

  const messageLower = userMessage.toLowerCase();

  // Plan tomorrow
  if (messageLower.includes('plan') || messageLower.includes('schedule')) {
    const schedule: TimeBlock[] = [];
    let currentTime = new Date();
    currentTime.setHours(8, 0, 0, 0);

    // Add events first
    timedEvents.forEach((event) => {
      schedule.push({
        startTime: event.startTime,
        endTime: event.endTime,
        title: event.title,
        type: 'event',
        eventId: event.id,
      });
    });

    return {
      content: `Good morning, Gal! Here's my suggested plan for tomorrow:\n\n` +
        `**Fixed commitments:**\n` +
        timedEvents.map((e) => `• ${new Date(e.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - ${e.title}`).join('\n') +
        `\n\n**Suggested task blocks:**\n` +
        `• 8:00 AM - 8:45 AM: ${urgentTasks[0]?.title || 'Deep work block'}\n` +
        `• 11:00 AM - 12:00 PM: ${urgentTasks[1]?.title || 'Admin tasks'}\n` +
        `• 2:00 PM - 2:50 PM: ${activeTasks[2]?.title || 'Focus time'}\n` +
        `• 4:00 PM - 4:30 PM: Wrap-up and planning\n\n` +
        `*I've scheduled urgent tasks during your best focus hours and left buffer time around meetings. Want me to adjust anything?*`,
      schedule,
    };
  }

  // What to do first
  if (messageLower.includes('first') || messageLower.includes('start')) {
    const topTask = urgentTasks[0] || activeTasks[0];
    if (topTask) {
      return {
        content: `I'd recommend starting with **"${topTask.title}"**.\n\n` +
          `It's marked as ${topTask.priority} priority` +
          (topTask.dueDate ? ' and due today' : '') +
          `. Estimated time: ${topTask.estimatedMinutes || 25} minutes.\n\n` +
          `Your first meeting isn't until ${timedEvents[0] ? new Date(timedEvents[0].startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '9:00 AM'}, ` +
          `so you have a good window for focused work.`,
      };
    }
    return { content: `All your urgent tasks are done! I'd suggest reviewing your medium-priority items or taking a well-deserved break.` };
  }

  // Find time for deep work
  if (messageLower.includes('deep work') || messageLower.includes('focus')) {
    return {
      content: `Looking at tomorrow's schedule, here are your best windows for deep work:\n\n` +
        `• **8:00 - 9:00 AM** - Fresh morning energy before standup\n` +
        `• **11:00 AM - 12:30 PM** - Good 90-min block after your strategy sync\n` +
        `• **2:00 - 3:00 PM** - Afternoon focus slot before engineering review\n\n` +
        `*I'd especially recommend the 11:00 slot if you need to tackle that investor update - you'll be warmed up from the earlier meeting.*`,
    };
  }

  // Quick tasks
  if (messageLower.includes('30 min') || messageLower.includes('quick')) {
    const quickTasks = activeTasks.filter((t) => (t.estimatedMinutes || 25) <= 30);
    if (quickTasks.length > 0) {
      return {
        content: `Here are tasks you can knock out in 30 minutes or less:\n\n` +
          quickTasks.map((t) => `• **${t.title}** (${t.estimatedMinutes || 25}m, ${t.priority})`).join('\n') +
          `\n\n*These are perfect for that gap before your ${timedEvents[0]?.title || 'next meeting'}.*`,
      };
    }
    return { content: `Most of your tasks need more than 30 minutes. Consider breaking down the larger ones?` };
  }

  // Default response
  return {
    content: `I can help you plan your day! Here's what I see:\n\n` +
      `**${activeTasks.length} active tasks** (${urgentTasks.length} urgent/high priority)\n` +
      `**${timedEvents.length} meetings** scheduled for tomorrow\n\n` +
      `Try asking me:\n` +
      `• "Plan my tomorrow"\n` +
      `• "What should I do first?"\n` +
      `• "Find time for deep work"\n` +
      `• "What can I finish in 30 minutes?"`,
  };
}

export function ChatPanel({ tasks, events, quickPrompts }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Update welcome message when data loads
  useEffect(() => {
    const activeTasks = tasks.filter((t) => t.status !== 'done').length;
    const eventCount = events.length;
    
    // Only update once we have data or after initial load
    if (!hasInitialized && (activeTasks > 0 || eventCount > 0)) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `Good evening, Gal! I'm your Chief of Staff. I'm here to help you plan tomorrow.\n\nI can see your **${activeTasks} active tasks** and **${eventCount} calendar events** for tomorrow. What would you like to work on?`,
        timestamp: new Date(),
      }]);
      setHasInitialized(true);
    } else if (!hasInitialized && messages.length === 0) {
      // Show loading state initially
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `Good evening, Gal! I'm your Chief of Staff. Loading your tasks and calendar...`,
        timestamp: new Date(),
      }]);
    }
  }, [tasks, events, hasInitialized, messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI thinking delay
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 700));

    const response = generateAIResponse(text, tasks, events);

    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response.content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsTyping(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  return (
    <div className="card-botanical flex flex-col h-full relative overflow-hidden">
      {/* Botanical decoration */}
      <img
        src={botanicalCorner}
        alt=""
        className="botanical-accent absolute -bottom-12 -left-12 w-48 h-48 opacity-15"
      />

      {/* Header */}
      <div className="p-4 border-b border-border/50 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-secondary rounded-lg">
            <Sparkles className="w-4 h-4 text-secondary-foreground" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-medium text-foreground">
              Chief of Staff
            </h2>
            <p className="text-xs text-muted-foreground">Your AI planning assistant</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4 relative z-10">
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={cn(
              'flex animate-slide-up',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div
              className={cn(
                'max-w-[85%] px-4 py-3 text-sm leading-relaxed',
                message.role === 'user' ? 'chat-user' : 'chat-assistant'
              )}
            >
              {/* Render markdown-style formatting */}
              <div className="prose prose-sm max-w-none">
                {message.content.split('\n').map((line, i) => (
                  <p key={i} className="mb-1 last:mb-0">
                    {line.split('**').map((part, j) =>
                      j % 2 === 1 ? (
                        <strong key={j} className="font-semibold text-foreground">
                          {part}
                        </strong>
                      ) : (
                        <span key={j}>{part}</span>
                      )
                    )}
                  </p>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start animate-fade-in">
            <div className="chat-assistant px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick prompts */}
      <div className="px-4 pb-2 relative z-10">
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSend(prompt)}
              className="quick-prompt"
              disabled={isTyping}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 pt-2 border-t border-border/50 relative z-10">
        <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-4 py-2 border border-border/50 focus-within:ring-1 focus-within:ring-ring/30">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me about your schedule..."
            disabled={isTyping}
            className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className={cn(
              'p-2 rounded-lg transition-colors',
              input.trim() && !isTyping
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'text-muted-foreground'
            )}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
