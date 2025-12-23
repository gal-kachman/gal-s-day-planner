import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatMessage, Task, CalendarEvent, ScheduleItem } from '@/types';
import { Send, Sparkles, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import botanicalCorner from '@/assets/botanical-corner.png';

interface ChatPanelProps {
  tasks: Task[];
  events: CalendarEvent[];
  quickPrompts: string[];
}

// Parse schedule JSON from Atlas response
function parseScheduleFromResponse(content: string): ScheduleItem[] | null {
  const scheduleMatch = content.match(/```schedule\s*([\s\S]*?)```/);
  if (!scheduleMatch) return null;
  
  try {
    const scheduleJson = scheduleMatch[1].trim();
    const parsed = JSON.parse(scheduleJson);
    if (Array.isArray(parsed)) {
      return parsed.map((item: any) => ({
        title: item.title,
        startTime: item.startTime,
        endTime: item.endTime,
        itemType: item.itemType as 'task' | 'event' | 'break',
        priority: item.priority,
        location: item.location,
        notes: item.notes,
      }));
    }
  } catch (e) {
    console.error('Failed to parse schedule JSON:', e);
  }
  return null;
}

// Remove schedule JSON block from display content
function cleanResponseContent(content: string): string {
  return content.replace(/```schedule\s*[\s\S]*?```/g, '').trim();
}

export function ChatPanel({ tasks, events, quickPrompts }: ChatPanelProps) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [pendingSchedule, setPendingSchedule] = useState<ScheduleItem[] | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Update welcome message when data loads
  useEffect(() => {
    const activeTasks = tasks.filter((t) => t.status !== 'done').length;
    const eventCount = events.length;
    
    if (!hasInitialized && (activeTasks > 0 || eventCount > 0)) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `ערב טוב. אני אטלס, ראש המטה שלך.\n\nאני רואה **${activeTasks} משימות פעילות** ו-**${eventCount} אירועים** ביומן של מחר. איך אפשר לעזור?`,
        timestamp: new Date(),
      }]);
      setHasInitialized(true);
    } else if (!hasInitialized && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `ערב טוב. אני אטלס, ראש המטה שלך. טוען את המשימות והיומן שלך...`,
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

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsTyping(true);
    setPendingSchedule(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/planning-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: updatedMessages,
            tasks,
            events,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get AI response');
      }

      const data = await response.json();
      
      // Check for schedule in response
      const schedule = parseScheduleFromResponse(data.response);
      if (schedule && schedule.length > 0) {
        setPendingSchedule(schedule);
      }
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: cleanResponseContent(data.response),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI chat error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an issue. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleConfirmSchedule = async () => {
    if (!pendingSchedule) return;

    setIsSaving(true);
    try {
      // Get tomorrow's date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/save-schedule`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            date: dateStr,
            items: pendingSchedule,
            summary: 'תכנון עם אטלס',
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save schedule');
      }

      toast({
        title: 'התכנית נשמרה!',
        description: 'מעביר אותך לתכנון היומי...',
      });

      setPendingSchedule(null);
      
      // Navigate to daily planner with the scheduled date
      setTimeout(() => {
        navigate(`/planner?date=${dateStr}`);
      }, 1000);
    } catch (error) {
      console.error('Save schedule error:', error);
      toast({
        title: 'שגיאה בשמירת התכנית',
        description: error instanceof Error ? error.message : 'אנא נסה שוב',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
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
              אטלס
            </h2>
            <p className="text-xs text-muted-foreground">ראש המטה שלך</p>
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
              <div className={cn("prose prose-sm max-w-none", message.role === 'assistant' && "text-right")} dir={message.role === 'assistant' ? 'rtl' : 'ltr'}>
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

      {/* Confirm Schedule Button */}
      {pendingSchedule && (
        <div className="px-4 py-3 border-t border-border/50 bg-secondary/30 relative z-10">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground" dir="rtl">
              אטלס הכין תכנית עם {pendingSchedule.length} פריטים
            </p>
            <Button
              onClick={handleConfirmSchedule}
              disabled={isSaving}
              className="gap-2"
            >
              <Check className="w-4 h-4" />
              {isSaving ? 'שומר...' : 'אשר תכנית'}
            </Button>
          </div>
        </div>
      )}

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
            placeholder="שאל אותי על לוח הזמנים שלך..."
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
