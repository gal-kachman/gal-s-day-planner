export type TaskStatus = 'todo' | 'doing' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  notes?: string;
  status: TaskStatus;
  priority: TaskPriority;
  estimatedMinutes?: number;
  dueDate?: string;
  tags?: string[];
  createdAt?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  location?: string;
  isAllDay?: boolean;
  description?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface TimeBlock {
  startTime: string;
  endTime: string;
  title: string;
  type: 'task' | 'event' | 'break';
  taskId?: string;
  eventId?: string;
}

export interface MicroseasonInfo {
  date: string;
  name: string;
  tone: string;
}
