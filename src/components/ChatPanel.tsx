import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatMessage, Task, CalendarEvent, ScheduleItem } from '@/types';
import { Send, Sparkles, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import botanicalCorner from '@/assets/botanical-corner.png';
import { personas, defaultPersonaId, Persona } from '@/data/personas';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatPanelProps {
  tasks: Task[];
  events: CalendarEvent[];
  quickPrompts: string[];
  libraryItems?: Array<{
    id: string;
    hebrewTitle: string;
    originalTitle?: string;
    mediaType: string;
    status: string;
    creators?: string;
  }>;
}

// Parse schedule JSON from response
function parseScheduleFromResponse(content: string): ScheduleItem[] | null {
  const codeBlockMatch = content.match(/```schedule\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      const scheduleJson = codeBlockMatch[1].trim();
      const parsed = JSON.parse(scheduleJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
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
      console.error('Failed to parse schedule code block:', e);
    }
  }
  
  const jsonArrayMatch = content.match(/\n\s*(\[\s*\{[\s\S]*?\}\s*\])\s*$/);
  if (jsonArrayMatch) {
    try {
      const parsed = JSON.parse(jsonArrayMatch[1]);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].startTime && parsed[0].itemType) {
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
      console.error('Failed to parse plain JSON array:', e);
    }
  }
  
  return null;
}

function cleanResponseContent(content: string): string {
  let cleaned = content.replace(/```schedule\s*[\s\S]*?```/g, '').trim();
  cleaned = cleaned.replace(/\n\s*\[\s*\{[\s\S]*?\}\s*\]\s*$/, '').trim();
  return cleaned;
}

const PERSONA_STORAGE_KEY = 'chief-of-staff-persona';

export function ChatPanel({ tasks, events, quickPrompts, libraryItems = [] }: ChatPanelProps) {
  const navigate = useNavigate();
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>(() => {
    return localStorage.getItem(PERSONA_STORAGE_KEY) || defaultPersonaId;
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [pendingSchedule, setPendingSchedule] = useState<ScheduleItem[] | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const persona: Persona = personas[selectedPersonaId] || personas[defaultPersonaId];
  const isDataLoaded = tasks.length > 0 || events.length > 0;

  const handlePersonaChange = (newPersonaId: string) => {
    localStorage.setItem(PERSONA_STORAGE_KEY, newPersonaId);
    setSelectedPersonaId(newPersonaId);
    setHasInitialized(false);
    setMessages([]);
    setPendingSchedule(null);
  };

  useEffect(() => {
    const activeTasks = tasks.filter((t) => t.status !== 'done').length;
    const eventCount = events.length;
    
    if (!hasInitialized && isDataLoaded) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: persona.welcomeTemplate(activeTasks, eventCount),
        timestamp: new Date(),
      }]);
      setHasInitialized(true);
    } else if (!hasInitialized && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: persona.loadingMessage,
        timestamp: new Date(),
      }]);
    }
  }, [tasks, events, hasInitialized, messages.length, isDataLoaded, persona]);

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
            libraryItems,
            persona: selectedPersonaId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get AI response');
      }

      const data = await response.json();
      
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
            summary: persona.saveSummary,
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
      <img
        src={botanicalCorner}
        alt=""
        className="botanical-accent absolute -bottom-12 -left-12 w-48 h-48 opacity-15"
      />

      {/* Header with Persona Selector */}
      <div className="p-4 border-b border-border/50 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-secondary rounded-lg">
              <Sparkles className="w-4 h-4 text-secondary-foreground" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-medium text-foreground">
                {persona.name}
              </h2>
              <p className="text-xs text-muted-foreground">{persona.subtitle}</p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground">
                החלף
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {Object.values(personas).map((p) => (
                <DropdownMenuItem
                  key={p.id}
                  onClick={() => handlePersonaChange(p.id)}
                  className={cn(
                    "cursor-pointer",
                    p.id === selectedPersonaId && "bg-accent"
                  )}
                >
                  <span className="font-medium">{p.name}</span>
                  <span className="text-xs text-muted-foreground mr-2">- {p.subtitle}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
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
              {persona.confirmButtonText(pendingSchedule.length)}
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
              disabled={isTyping || !isDataLoaded}
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
            placeholder={isDataLoaded ? "שאל אותי על לוח הזמנים שלך..." : "ממתין לטעינת נתונים..."}
            disabled={isTyping || !isDataLoaded}
            className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping || !isDataLoaded}
            className={cn(
              'p-2 rounded-lg transition-colors',
              input.trim() && !isTyping && isDataLoaded
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
