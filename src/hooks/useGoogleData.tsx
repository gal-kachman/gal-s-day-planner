import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Task, CalendarEvent } from '@/types';

interface GoogleDataConfig {
  calendarId: string;
  spreadsheetId: string;
  sheetRange?: string;
}

interface GoogleDataResult {
  events?: CalendarEvent[];
  tasks?: Task[];
}

export function useGoogleData() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  const fetchData = useCallback(async (config: GoogleDataConfig, action: 'calendar' | 'tasks' | 'all' = 'all') => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke<GoogleDataResult>('google-data', {
        body: {
          action,
          calendarId: config.calendarId,
          spreadsheetId: config.spreadsheetId,
          sheetRange: config.sheetRange || 'Tasks!A:G',
        },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.events) {
        setEvents(data.events);
      }
      if (data?.tasks) {
        setTasks(data.tasks);
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch Google data';
      setError(message);
      console.error('Error fetching Google data:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCalendar = useCallback(async (calendarId: string) => {
    return fetchData({ calendarId, spreadsheetId: '' }, 'calendar');
  }, [fetchData]);

  const fetchTasks = useCallback(async (spreadsheetId: string, sheetRange?: string) => {
    return fetchData({ calendarId: '', spreadsheetId, sheetRange }, 'tasks');
  }, [fetchData]);

  return {
    loading,
    error,
    events,
    tasks,
    fetchData,
    fetchCalendar,
    fetchTasks,
  };
}
