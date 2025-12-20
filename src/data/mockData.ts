import { Task, CalendarEvent, MicroseasonInfo } from '@/types';

// Get tomorrow's date
const getTomorrow = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow;
};

const tomorrow = getTomorrow();
const tomorrowStr = tomorrow.toISOString().split('T')[0];

export const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Review quarterly OKRs and prepare summary',
    notes: 'Focus on Q4 targets and blockers',
    status: 'todo',
    priority: 'high',
    estimatedMinutes: 45,
    dueDate: tomorrowStr,
    tags: ['strategy', 'planning'],
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Draft investor update email',
    notes: 'Include metrics from dashboard',
    status: 'doing',
    priority: 'urgent',
    estimatedMinutes: 60,
    dueDate: tomorrowStr,
    tags: ['investors', 'comms'],
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Schedule 1:1s with direct reports',
    status: 'todo',
    priority: 'medium',
    estimatedMinutes: 20,
    tags: ['team'],
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'Review design mockups for new feature',
    notes: 'Focus on mobile experience',
    status: 'todo',
    priority: 'medium',
    estimatedMinutes: 30,
    tags: ['product', 'design'],
    createdAt: new Date().toISOString(),
  },
  {
    id: '5',
    title: 'Prepare board deck slides 3-7',
    status: 'todo',
    priority: 'high',
    estimatedMinutes: 90,
    dueDate: tomorrowStr,
    tags: ['board', 'presentation'],
    createdAt: new Date().toISOString(),
  },
  {
    id: '6',
    title: 'Clear inbox to zero',
    status: 'todo',
    priority: 'low',
    estimatedMinutes: 25,
    tags: ['admin'],
    createdAt: new Date().toISOString(),
  },
];

export const mockEvents: CalendarEvent[] = [
  {
    id: 'e1',
    title: 'Morning standup',
    startTime: `${tomorrowStr}T09:00:00`,
    endTime: `${tomorrowStr}T09:30:00`,
    location: 'Zoom',
  },
  {
    id: 'e2',
    title: 'Product strategy sync',
    startTime: `${tomorrowStr}T10:00:00`,
    endTime: `${tomorrowStr}T11:00:00`,
    location: 'Conference Room A',
    description: 'Quarterly roadmap review',
  },
  {
    id: 'e3',
    title: 'Lunch with Sarah (Investor)',
    startTime: `${tomorrowStr}T12:30:00`,
    endTime: `${tomorrowStr}T14:00:00`,
    location: 'The Mill Café',
  },
  {
    id: 'e4',
    title: 'Engineering review',
    startTime: `${tomorrowStr}T15:00:00`,
    endTime: `${tomorrowStr}T16:00:00`,
    location: 'Zoom',
  },
  {
    id: 'e5',
    title: 'End of year planning',
    startTime: `${tomorrowStr}T00:00:00`,
    endTime: `${tomorrowStr}T23:59:59`,
    isAllDay: true,
  },
];

export const mockMicroseason: MicroseasonInfo = {
  date: tomorrow.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  }),
  name: 'Plum Blossoms Open',
  tone: 'First signs of spring stir beneath the frost',
};

export const quickPrompts = [
  'Plan my tomorrow',
  'Find time for deep work',
  'What should I do first?',
  'What can I finish in 30 min?',
];
