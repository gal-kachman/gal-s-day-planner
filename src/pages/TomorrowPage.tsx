import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MicroseasonHeader } from '@/components/MicroseasonHeader';
import { TasksCard } from '@/components/TasksCard';
import { EventsCard } from '@/components/EventsCard';
import { ChatPanel } from '@/components/ChatPanel';
import botanicalFooter from '@/assets/botanical-footer.png';
import { Task, TaskStatus, TaskPriority, CalendarEvent } from '@/types';
import { mockMicroseason, quickPrompts } from '@/data/mockData';
import { useAuth } from '@/hooks/useAuth';
import { useGoogleData } from '@/hooks/useGoogleData';
import { Loader2, LogOut, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

// Your Google integration config
const GOOGLE_CONFIG = {
  calendarId: 'c27ecdqu2qtgmr51v7r3iggre4@group.calendar.google.com',
  spreadsheetId: '18VH_PFbgVD86BCLnin775mkELzGuj--kfLwz1xt9axs',
  sheetRange: 'Sheet1!A:E',
};

export default function TomorrowPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { loading: dataLoading, error, events: googleEvents, tasks: googleTasks, fetchData } = useGoogleData();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Fetch Google data on mount
  useEffect(() => {
    if (user) {
      fetchData(GOOGLE_CONFIG, 'all');
    }
  }, [user, fetchData]);

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
        title: 'Failed to load data',
        description: error,
        variant: 'destructive',
      });
    }
  }, [error]);

  const handleRefresh = () => {
    fetchData(GOOGLE_CONFIG, 'all');
  };

  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, status } : task))
    );
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background paper-texture flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Tomorrow | Chief of Staff</title>
        <meta name="description" content="Plan your tomorrow with AI-powered scheduling assistance. View tasks, calendar events, and get personalized productivity recommendations." />
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
              <RefreshCw className={`w-4 h-4 mr-2 ${dataLoading ? 'animate-spin' : ''}`} />
              {dataLoading ? 'Syncing...' : 'Sync with Google'}
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
            <div className="absolute inset-0 flex items-center justify-center gap-4">
              <p className="text-xs text-muted-foreground font-serif italic bg-background/60 px-4 py-1 rounded-full">
                Chief of Staff · Your AI planning companion
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="h-7 text-xs text-muted-foreground hover:text-foreground bg-background/60"
              >
                <LogOut className="w-3 h-3 mr-1" />
                Sign out
              </Button>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
