import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { MicroseasonHeader } from '@/components/MicroseasonHeader';
import { TasksCard } from '@/components/TasksCard';
import { EventsCard } from '@/components/EventsCard';
import { ChatPanel } from '@/components/ChatPanel';
import botanicalFooter from '@/assets/botanical-footer.png';
import { Task, TaskStatus, TaskPriority, CalendarEvent, LibraryItem } from '@/types';
import { mockMicroseason, quickPrompts } from '@/data/mockData';
import { useGoogleData } from '@/hooks/useGoogleData';
import { useLibraryData } from '@/hooks/useLibraryData';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Your Google integration config
const GOOGLE_CONFIG = {
  calendarId: 'c27ecdqu2qtgmr51v7r3iggre4@group.calendar.google.com',
  spreadsheetId: '18VH_PFbgVD86BCLnin775mkELzGuj--kfLwz1xt9axs',
  sheetRange: 'tasks!A:E',
};

const LIBRARY_SPREADSHEET_ID = '18VH_PFbgVD86BCLnin775mkELzGuj--kfLwz1xt9axs';

export default function TomorrowPage() {
  const { loading: dataLoading, error, events: googleEvents, tasks: googleTasks, fetchData } = useGoogleData();
  const { items: libraryItems } = useLibraryData({ spreadsheetId: LIBRARY_SPREADSHEET_ID });

  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // Fetch Google data on mount
  useEffect(() => {
    fetchData(GOOGLE_CONFIG, 'all');
  }, [fetchData]);

  // Sync Google data to local state
  useEffect(() => {
    if (googleTasks.length > 0) {
      setTasks(googleTasks);
    }
  }, [googleTasks]);

  useEffect(() => {
    if (googleEvents.length > 0) {
      setEvents(googleEvents);
    }
  }, [googleEvents]);

  // Show error toast if data fetch fails
  useEffect(() => {
    if (error) {
      toast({
        title: 'טעינת הנתונים נכשלה',
        description: error,
        variant: 'destructive',
      });
    }
  }, [error]);

  const handleRefresh = () => {
    fetchData(GOOGLE_CONFIG, 'all');
  };

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    // Find task before updating state
    const task = tasks.find(t => t.id === taskId);
    
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status } : t))
    );

    // Log completion to database when marked as done
    if (status === 'done' && task) {
      const { error } = await supabase.from('task_completions').insert({
        task_title: task.title,
        original_task_id: task.id,
        notes: task.notes || null,
        priority: task.priority || null,
      });
      
      if (error) {
        console.error('Failed to log task completion:', error);
      }
    }
  };

  const handlePriorityChange = (taskId: string, priority: TaskPriority) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, priority } : task))
    );
  };

  const handleEstimateChange = (taskId: string, estimatedMinutes: number) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, estimatedMinutes } : task))
    );
  };

  const handleAddTask = (title: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      status: 'todo',
      priority: 'medium',
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [...prev, newTask]);
  };

  return (
    <>
      <Helmet>
        <title>מחר | אטלס</title>
        <meta name="description" content="תכנן את המחר שלך עם עזרה של בינה מלאכותית. צפה במשימות, אירועי יומן וקבל המלצות פרודוקטיביות מותאמות אישית." />
      </Helmet>

      <div className="min-h-screen bg-background paper-texture">
        {/* Microseason Header */}
        <MicroseasonHeader microseason={mockMicroseason} />

        {/* Main content */}
        <main className="container mx-auto max-w-7xl px-4 py-6">
          {/* Refresh button */}
          <div className="flex justify-end mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={dataLoading}
              className="text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={`w-4 h-4 ml-2 ${dataLoading ? 'animate-spin' : ''}`} />
              {dataLoading ? 'מסנכרן...' : 'סנכרן עם Google'}
            </Button>
          </div>

          {/* Top row: Tasks + Events side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tasks Card */}
            <div className="min-h-[400px]">
              <TasksCard
                tasks={tasks}
                onStatusChange={handleStatusChange}
                onPriorityChange={handlePriorityChange}
                onEstimateChange={handleEstimateChange}
                onAddTask={handleAddTask}
              />
            </div>

            {/* Events Card */}
            <div className="min-h-[400px]">
              <EventsCard events={events} />
            </div>
          </div>

          {/* Chat Panel below */}
          <div className="mt-6 min-h-[350px]">
            <ChatPanel
              tasks={tasks}
              events={events}
              quickPrompts={quickPrompts}
              libraryItems={libraryItems}
            />
          </div>
        </main>

        {/* Footer with botanical illustration */}
        <footer className="relative mt-8 pt-4 border-t border-border/20">
          <div className="relative overflow-hidden">
            <img
              src={botanicalFooter}
              alt=""
              className="w-full h-24 object-cover opacity-40 pointer-events-none"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-xs text-muted-foreground font-serif italic bg-background/60 px-4 py-1 rounded-full">
                אטלס · העוזר האישי שלך לתכנון יומי
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
