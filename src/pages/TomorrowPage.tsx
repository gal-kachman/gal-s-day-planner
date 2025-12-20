import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { MicroseasonHeader } from '@/components/MicroseasonHeader';
import { TasksCard } from '@/components/TasksCard';
import { EventsCard } from '@/components/EventsCard';
import { ChatPanel } from '@/components/ChatPanel';
import botanicalFooter from '@/assets/botanical-footer.png';
import { Task, TaskStatus, TaskPriority } from '@/types';
import { mockTasks, mockEvents, mockMicroseason, quickPrompts } from '@/data/mockData';

export default function TomorrowPage() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);

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
              <EventsCard events={mockEvents} />
            </div>
          </div>

          {/* Chat Panel below */}
          <div className="mt-6 min-h-[350px]">
            <ChatPanel
              tasks={tasks}
              events={mockEvents}
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
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-xs text-muted-foreground font-serif italic bg-background/60 px-4 py-1 rounded-full">
                Chief of Staff · Your AI planning companion
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
