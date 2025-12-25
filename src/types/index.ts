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
  reasonShort?: string;
  rowNumber?: number; // Original row number in Google Sheet for updates
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

export interface ScheduleItem {
  title: string;
  startTime: string; // "HH:MM" format
  endTime?: string;
  itemType: 'task' | 'event' | 'break';
  priority?: TaskPriority;
  location?: string;
  notes?: string;
}

// Library/Culture types
export interface LibraryItem {
  id: string;
  status: string;
  mediaType: string;
  hebrewTitle: string;
  originalTitle?: string;
  creators?: string;
  year?: string;
  summary?: string;
  notes?: string;
  imageUrl?: string;
}

export interface ScheduledDay {
  id: string;
  date: string;
  createdAt: string;
  conversationSummary?: string;
  items: ScheduleItem[];
}
