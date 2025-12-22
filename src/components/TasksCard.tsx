import { useState } from 'react';
import { Task, TaskStatus, TaskPriority } from '@/types';
import { Check, Circle, Loader2, Plus, Clock, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TasksCardProps {
  tasks: Task[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onPriorityChange: (taskId: string, priority: TaskPriority) => void;
  onEstimateChange: (taskId: string, minutes: number) => void;
  onAddTask: (title: string) => void;
}

const priorityConfig: Record<TaskPriority, { label: string; className: string; dotColor: string }> = {
  urgent: { label: 'דחוף', className: 'priority-urgent', dotColor: 'bg-priority-urgent' },
  high: { label: 'גבוה', className: 'priority-high', dotColor: 'bg-priority-high' },
  medium: { label: 'בינוני', className: 'priority-medium', dotColor: 'bg-priority-medium' },
  low: { label: 'נמוך', className: 'priority-low', dotColor: 'bg-priority-low' },
};

const statusIcons: Record<TaskStatus, React.ReactNode> = {
  todo: <Circle className="w-4 h-4" />,
  doing: <Loader2 className="w-4 h-4 animate-spin" />,
  done: <Check className="w-4 h-4" />,
};

export function TasksCard({
  tasks,
  onStatusChange,
  onPriorityChange,
  onEstimateChange,
  onAddTask,
}: TasksCardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingEstimate, setEditingEstimate] = useState<string | null>(null);
  const [tempEstimate, setTempEstimate] = useState('');

  const filteredTasks = tasks
    .filter((task) => task.status !== 'done')
    .filter((task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  const handleStatusCycle = (task: Task) => {
    const statusOrder: TaskStatus[] = ['todo', 'doing', 'done'];
    const currentIndex = statusOrder.indexOf(task.status);
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
    onStatusChange(task.id, nextStatus);
  };

  const handlePriorityCycle = (task: Task) => {
    const priorityOrder: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];
    const currentIndex = priorityOrder.indexOf(task.priority);
    const nextPriority = priorityOrder[(currentIndex + 1) % priorityOrder.length];
    onPriorityChange(task.id, nextPriority);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      onAddTask(newTaskTitle.trim());
      setNewTaskTitle('');
    }
  };

  const handleEstimateSubmit = (taskId: string) => {
    const minutes = parseInt(tempEstimate, 10);
    if (!isNaN(minutes) && minutes > 0) {
      onEstimateChange(taskId, minutes);
    }
    setEditingEstimate(null);
    setTempEstimate('');
  };

  return (
    <div className="card-botanical flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-xl font-medium text-foreground">
            המשימות שלי
          </h2>
          <span className="text-sm text-muted-foreground">
            {filteredTasks.length} פעילות
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="חיפוש משימות..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-muted/50 border border-border/50 rounded-lg 
                       placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring/50"
          />
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
        <ul className="space-y-1">
          {filteredTasks.map((task, index) => (
            <li
              key={task.id}
              className="group p-3 rounded-lg hover:bg-muted/50 transition-colors animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start gap-3">
                {/* Status button */}
                <button
                  onClick={() => handleStatusCycle(task)}
                  className={cn(
                    'mt-0.5 p-1 rounded-full transition-colors',
                    task.status === 'todo' && 'text-muted-foreground hover:text-foreground hover:bg-muted',
                    task.status === 'doing' && 'text-status-doing bg-status-doing/20',
                    task.status === 'done' && 'text-status-done bg-status-done/30'
                  )}
                  title={`Status: ${task.status}`}
                >
                  {statusIcons[task.status]}
                </button>

                {/* Task content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground leading-snug">
                    {task.title}
                  </p>
                  {task.notes && (
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                      {task.notes}
                    </p>
                  )}

                  {/* Tags and metadata */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {/* Priority pill */}
                    <button
                      onClick={() => handlePriorityCycle(task)}
                      className={cn(
                        'px-2 py-0.5 text-xs font-medium rounded-full border transition-colors',
                        priorityConfig[task.priority].className
                      )}
                    >
                      {priorityConfig[task.priority].label}
                    </button>

                    {/* Estimate */}
                    {editingEstimate === task.id ? (
                      <input
                        type="number"
                        value={tempEstimate}
                        onChange={(e) => setTempEstimate(e.target.value)}
                        onBlur={() => handleEstimateSubmit(task.id)}
                        onKeyDown={(e) => e.key === 'Enter' && handleEstimateSubmit(task.id)}
                        className="w-16 px-2 py-0.5 text-xs bg-muted border border-border rounded"
                        placeholder="min"
                        autoFocus
                      />
                    ) : (
                      <button
                        onClick={() => {
                          setEditingEstimate(task.id);
                          setTempEstimate(task.estimatedMinutes?.toString() || '');
                        }}
                        className="flex items-center gap-1 px-2 py-0.5 text-xs text-muted-foreground 
                                   bg-muted/50 rounded-full hover:bg-muted transition-colors"
                      >
                        <Clock className="w-3 h-3" />
                        {task.estimatedMinutes ? `${task.estimatedMinutes} דק׳` : 'הוסף זמן'}
                      </button>
                    )}

                    {/* Tags */}
                    {task.tags?.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 text-xs text-muted-foreground bg-secondary/50 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {filteredTasks.length === 0 && (
          <div className="py-8 text-center text-muted-foreground text-sm">
            {searchQuery ? 'לא נמצאו משימות' : 'כל המשימות הושלמו!'}
          </div>
        )}
      </div>

      {/* Add task */}
      <form onSubmit={handleAddTask} className="p-3 border-t border-border/50">
        <div className="flex items-center gap-2">
          <Plus className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="הוסף משימה חדשה..."
            className="flex-1 text-sm bg-transparent placeholder:text-muted-foreground 
                       focus:outline-none"
          />
        </div>
      </form>
    </div>
  );
}
