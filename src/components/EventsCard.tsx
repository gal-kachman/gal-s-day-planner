import { CalendarEvent } from '@/types';
import { Clock, MapPin, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EventsCardProps {
  events: CalendarEvent[];
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('he-IL', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
  });
}

function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

function getDurationMinutes(start: string, end: string): number {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
}

export function EventsCard({ events }: EventsCardProps) {
  // Separate all-day events from timed events
  const allDayEvents = events.filter((e) => e.isAllDay);
  const timedEvents = events
    .filter((e) => !e.isAllDay)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  return (
    <div className="card-botanical flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-medium text-foreground">
            לוח הזמנים של מחר
          </h2>
          <span className="text-sm text-muted-foreground">
            {events.length} אירועים
          </span>
        </div>
      </div>

      {/* Events list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        {/* All-day events */}
        {allDayEvents.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              כל היום
            </p>
            <div className="space-y-2">
              {allDayEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-accent/50 border border-accent/30"
                >
                  <Calendar className="w-4 h-4 text-accent-foreground/70" />
                  <span className="text-sm font-medium text-accent-foreground">
                    {event.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timed events - timeline view */}
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[3px] top-3 bottom-3 w-px bg-border" />

          <ul className="space-y-4">
            {timedEvents.map((event, index) => {
              const duration = getDurationMinutes(event.startTime, event.endTime);
              const isLong = duration >= 60;

              return (
                <li
                  key={event.id}
                  className="relative pl-6 animate-slide-up"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  {/* Timeline dot */}
                  <div
                    className={cn(
                      'absolute left-0 top-1.5 w-[7px] h-[7px] rounded-full border-2 border-background',
                      isLong ? 'bg-botanical-terracotta' : 'bg-muted-foreground'
                    )}
                  />

                  <div className="group">
                    {/* Time */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatTimeRange(event.startTime, event.endTime)}</span>
                      <span className="text-xs opacity-70">({duration} דק׳)</span>
                    </div>

                    {/* Event card */}
                    <div
                      className={cn(
                        'p-3 rounded-lg border transition-colors',
                        'bg-card hover:bg-muted/30 border-border/50'
                      )}
                    >
                      <h3 className="font-medium text-foreground text-sm leading-snug">
                        {event.title}
                      </h3>

                      {event.location && (
                        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span>{event.location}</span>
                        </div>
                      )}

                      {event.description && (
                        <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {events.length === 0 && (
          <div className="py-8 text-center text-muted-foreground text-sm">
            אין אירועים מתוכננים למחר
          </div>
        )}
      </div>
    </div>
  );
}
