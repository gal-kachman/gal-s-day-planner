import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { Check, Calendar, ListTodo, Coffee, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import plannerBg from '@/assets/planner-bg-minimal.jpeg';

interface ScheduledItem {
  id: string;
  title: string;
  start_time: string;
  end_time: string | null;
  item_type: 'task' | 'event' | 'break';
  priority: string | null;
  location: string | null;
  notes: string | null;
  is_done: boolean;
  order_index: number;
}

interface ScheduledDay {
  id: string;
  date: string;
  created_at: string;
  conversation_summary: string | null;
}

const timeSlots = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];

const itemTypeIcons = {
  task: ListTodo,
  event: Calendar,
  break: Coffee,
};

const itemTypeColors = {
  task: 'bg-primary/10 border-primary/30 text-primary',
  event: 'bg-secondary/50 border-secondary text-secondary-foreground',
  break: 'bg-muted/50 border-muted-foreground/20 text-muted-foreground',
};

export default function DailyPlannerPage() {
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  
  // Initialize with URL date param or default to today
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (dateParam) {
      try {
        return parseISO(dateParam);
      } catch {
        return new Date();
      }
    }
    return new Date();
  });
  const [scheduledDay, setScheduledDay] = useState<ScheduledDay | null>(null);
  const [items, setItems] = useState<ScheduledItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch schedule - show selected date's plan, or fall back to most recent plan
  useEffect(() => {
    async function fetchSchedule() {
      setLoading(true);
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      // First, try to fetch schedule for the selected date
      let { data: dayData, error: dayError } = await supabase
        .from('scheduled_days')
        .select('*')
        .eq('date', dateStr)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (dayError) {
        console.error('Error fetching scheduled day:', dayError);
        setLoading(false);
        return;
      }

      // If no plan for selected date, fetch the most recent plan overall
      if (!dayData) {
        const { data: latestData, error: latestError } = await supabase
          .from('scheduled_days')
          .select('*')
          .order('date', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestError) {
          console.error('Error fetching latest schedule:', latestError);
          setLoading(false);
          return;
        }

        dayData = latestData;
      }

      if (!dayData) {
        setScheduledDay(null);
        setItems([]);
        setLoading(false);
        return;
      }

      setScheduledDay(dayData);

      // Fetch items for this day
      const { data: itemsData, error: itemsError } = await supabase
        .from('scheduled_items')
        .select('*')
        .eq('scheduled_day_id', dayData.id)
        .order('order_index');

      if (itemsError) {
        console.error('Error fetching items:', itemsError);
      } else {
        setItems((itemsData || []) as ScheduledItem[]);
      }

      setLoading(false);
    }

    fetchSchedule();
  }, [selectedDate]);

  const toggleItemDone = async (itemId: string, currentDone: boolean) => {
    const { error } = await supabase
      .from('scheduled_items')
      .update({ is_done: !currentDone })
      .eq('id', itemId);

    if (error) {
      console.error('Error updating item:', error);
      return;
    }

    setItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, is_done: !currentDone } : item
      )
    );
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  // Group items by hour for the timeline
  const getItemForTimeSlot = (timeSlot: string): ScheduledItem | undefined => {
    return items.find(item => {
      const itemHour = item.start_time.substring(0, 5);
      return itemHour === timeSlot;
    });
  };

  return (
    <>
      <Helmet>
        <title>תכנון יומי | אטלס</title>
        <meta name="description" content="תכנן את היום שלך עם אטלס" />
      </Helmet>

      <div 
        className="min-h-screen w-screen bg-no-repeat bg-cover bg-center px-12 py-8 overflow-hidden" 
        style={{
          backgroundImage: `url(${plannerBg})`,
          backgroundSize: '100% 100%'
        }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-serif text-stone-800 tracking-wide">
            תכנון יומי
          </h1>
          
          {/* Date navigation */}
          <div className="flex items-center justify-center gap-4 mt-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateDay('prev')}
              className="text-stone-600 hover:text-stone-800"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
            <p className="text-sm text-stone-600">
              {format(selectedDate, 'EEEE, d בMMMM yyyy', { locale: he })}
            </p>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateDay('next')}
              className="text-stone-600 hover:text-stone-800"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Show notice if displaying a different date's plan */}
          {scheduledDay && scheduledDay.date !== format(selectedDate, 'yyyy-MM-dd') && (
            <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-1 mt-2 inline-block">
              מציג תכנית מתאריך {format(parseISO(scheduledDay.date), 'd בMMMM', { locale: he })}
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-stone-500">טוען...</p>
          </div>
        ) : !scheduledDay ? (
          /* No schedule - show empty state */
          <div className="max-w-2xl mx-auto text-center py-16">
            <Calendar className="w-16 h-16 mx-auto text-stone-400 mb-4" />
            <h2 className="text-xl font-serif text-stone-700 mb-2">
              אין תכנית ליום הזה
            </h2>
            <p className="text-stone-500 mb-6">
              לך לעמוד הראשי ותכנן את היום עם אטלס
            </p>
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="border-stone-400 text-stone-700"
            >
              תכנן עם אטלס
            </Button>
          </div>
        ) : (
          /* Show scheduled items */
          <div className="max-w-4xl mx-auto">
            {scheduledDay.conversation_summary && (
              <p className="text-sm text-stone-600 text-center mb-6 italic">
                {scheduledDay.conversation_summary}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Timeline view */}
              <div className="space-y-1">
                <h2 className="text-sm font-medium text-stone-600 mb-3 tracking-wider uppercase text-center">
                  לוח זמנים
                </h2>
                <div className="space-y-2">
                  {timeSlots.map((time) => {
                    const item = getItemForTimeSlot(time);
                    const Icon = item ? itemTypeIcons[item.item_type] : null;
                    
                    return (
                      <div key={time} className="flex items-center gap-3 group">
                        <span className="text-xs text-stone-400 w-10 font-mono">{time}</span>
                        {item ? (
                          <div
                            className={cn(
                              'flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border transition-all cursor-pointer',
                              itemTypeColors[item.item_type],
                              item.is_done && 'opacity-50'
                            )}
                            onClick={() => toggleItemDone(item.id, item.is_done)}
                          >
                            <button
                              className={cn(
                                'w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors',
                                item.is_done 
                                  ? 'bg-stone-600 border-stone-600' 
                                  : 'border-stone-400 hover:border-stone-600'
                              )}
                            >
                              {item.is_done && <Check className="w-3 h-3 text-white" />}
                            </button>
                            {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
                            <span className={cn(
                              'text-sm flex-1',
                              item.is_done && 'line-through'
                            )}>
                              {item.title}
                            </span>
                            {item.end_time && (
                              <span className="text-xs opacity-60">
                                עד {item.end_time.substring(0, 5)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex-1 border-b border-stone-300/30 py-2" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Items list */}
              <div>
                <h2 className="text-sm font-medium text-stone-600 mb-3 tracking-wider uppercase text-center">
                  רשימת פריטים
                </h2>
                <div className="space-y-2">
                  {items.map((item) => {
                    const Icon = itemTypeIcons[item.item_type];
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          'flex items-center gap-3 px-4 py-3 rounded-lg border transition-all cursor-pointer',
                          itemTypeColors[item.item_type],
                          item.is_done && 'opacity-50'
                        )}
                        onClick={() => toggleItemDone(item.id, item.is_done)}
                      >
                        <button
                          className={cn(
                            'w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors',
                            item.is_done 
                              ? 'bg-stone-600 border-stone-600' 
                              : 'border-stone-400 hover:border-stone-600'
                          )}
                        >
                          {item.is_done && <Check className="w-3 h-3 text-white" />}
                        </button>
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            'text-sm font-medium truncate',
                            item.is_done && 'line-through'
                          )}>
                            {item.title}
                          </p>
                          <p className="text-xs opacity-70">
                            {item.start_time.substring(0, 5)}
                            {item.end_time && ` - ${item.end_time.substring(0, 5)}`}
                            {item.location && ` · ${item.location}`}
                          </p>
                        </div>
                        {item.priority && (
                          <span className={cn(
                            'text-xs px-2 py-0.5 rounded-full',
                            item.priority === 'urgent' && 'bg-red-100 text-red-700',
                            item.priority === 'high' && 'bg-orange-100 text-orange-700',
                            item.priority === 'medium' && 'bg-yellow-100 text-yellow-700',
                            item.priority === 'low' && 'bg-green-100 text-green-700'
                          )}>
                            {item.priority}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
