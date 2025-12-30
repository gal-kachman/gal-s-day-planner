export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  taskId: string; // Column A - original task ID from sheet
  title: string; // Column B
  dueDate?: string; // Column C
  clarifiedNextAction?: string; // Column D
  eisenhowerQuadrant?: string; // Column E
  priorityRank?: number; // Column F
  delegateTo?: string; // Column G
  reasonShort?: string; // Column H
  createdAt?: string; // Column I
  completion: boolean; // Column J - checkbox
  completionTimestamp?: string; // Column K
  priority: TaskPriority;
  notes?: string;
  estimatedMinutes?: number;
  tags?: string[];
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
