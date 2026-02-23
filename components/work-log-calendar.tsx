'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Tag, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WorkEvent {
  id: number;
  date: Date;
  title: string;
  durationMinutes: number;
  clientTag?: string;
  projectTag?: string;
  activityType?: 'product' | 'sales' | 'ops' | 'fundraising' | 'support' | 'other';
  billable: boolean;
}

interface WorkLogCalendarProps {
  events: WorkEvent[];
  onTagEvent?: (eventId: number, tags: { clientTag?: string; projectTag?: string; activityType?: string }) => void;
  clients?: Array<{ id: number; name: string }>;
}

export function WorkLogCalendar({ events, onTagEvent, clients = [] }: WorkLogCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const getEventsForDate = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return events.filter(e => 
      e.date.getDate() === day && 
      e.date.getMonth() === currentDate.getMonth() && 
      e.date.getFullYear() === currentDate.getFullYear()
    );
  };

  const activityTypeColors = {
    product: 'bg-blue-100 text-blue-800',
    sales: 'bg-green-100 text-green-800',
    ops: 'bg-yellow-100 text-yellow-800',
    fundraising: 'bg-purple-100 text-purple-800',
    support: 'bg-pink-100 text-pink-800',
    other: 'bg-gray-100 text-gray-800',
  };

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const emptyDays = Array(firstDayOfMonth).fill(null);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">{monthName}</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayLabels.map(day => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1 mb-6">
          {emptyDays.map((_, idx) => (
            <div key={`empty-${idx}`} className="aspect-square rounded bg-secondary/20" />
          ))}
          {Array.from({ length: daysInMonth }, (_, idx) => {
            const day = idx + 1;
            const dayEvents = getEventsForDate(day);
            const totalMinutes = dayEvents.reduce((sum, e) => sum + e.durationMinutes, 0);
            
            return (
              <div
                key={day}
                className="aspect-square rounded border border-border bg-card p-1 flex flex-col cursor-pointer hover:bg-secondary/50 transition-colors"
              >
                <span className="text-xs font-semibold text-muted-foreground">{day}</span>
                <div className="flex-1 text-xs text-muted-foreground mt-1">
                  {totalMinutes > 0 && (
                    <span className="font-medium">{(totalMinutes / 60).toFixed(1)}h</span>
                  )}
                </div>
                {dayEvents.length > 0 && (
                  <div className="flex gap-0.5 flex-wrap">
                    {dayEvents.slice(0, 2).map(event => (
                      <span
                        key={event.id}
                        className="h-1.5 w-1.5 rounded-full bg-[#28A745]"
                        title={event.title}
                      />
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-xs text-muted-foreground">+{dayEvents.length - 2}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Day details view */}
        {selectedEvent !== null && (
          <div className="border-t border-border pt-4">
            <h4 className="font-semibold mb-4">Events</h4>
            <div className="space-y-3">
              {events
                .filter(e => e.date.getDate() === selectedEvent)
                .map(event => (
                  <div
                    key={event.id}
                    className="flex items-start justify-between rounded-lg bg-secondary/20 p-3"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{event.title}</p>
                      <div className="mt-1 flex gap-2 flex-wrap">
                        {event.activityType && (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            activityTypeColors[event.activityType]
                          }`}>
                            {event.activityType}
                          </span>
                        )}
                        {event.clientTag && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {event.clientTag}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {(event.durationMinutes / 60).toFixed(1)}h
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // Auto-tag logic would go here
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Summary stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total hours this month</p>
          <p className="mt-2 text-2xl font-bold">
            {(events.reduce((sum, e) => sum + e.durationMinutes, 0) / 60).toFixed(1)}h
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Billable hours</p>
          <p className="mt-2 text-2xl font-bold">
            {(events.filter(e => e.billable).reduce((sum, e) => sum + e.durationMinutes, 0) / 60).toFixed(1)}h
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Work days</p>
          <p className="mt-2 text-2xl font-bold">
            {new Set(events.map(e => e.date.toDateString())).size}
          </p>
        </div>
      </div>
    </div>
  );
}
