import React from "react";
import { Clock, Calendar as CalendarIcon } from "lucide-react";
import { EventsResponse, DateRange } from "../types";
import { format, parseISO } from "date-fns";

interface EventListProps {
  eventsData: EventsResponse | null;
  dateRange: DateRange;
}

const EventList: React.FC<EventListProps> = ({ eventsData, dateRange }) => {
  if (!eventsData) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="text-gray-500">No events data available</div>
      </div>
    );
  }

  const { events } = eventsData;

  if (events.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No events</h3>
        <p className="mt-1 text-sm text-gray-500">No events found for the selected date range.</p>
      </div>
    );
  }

  const formatEventTime = (startTime: string, endTime: string) => {
    const start = parseISO(startTime);
    const end = parseISO(endTime);

    const startTimeStr = format(start, "HH:mm");
    const endTimeStr = format(end, "HH:mm");

    return `${startTimeStr} - ${endTimeStr}`;
  };

  const formatGroupTitle = (group: any) => {
    if (dateRange <= 7) {
      // Group by day - ensure date exists and is valid
      if (!group.date || isNaN(Date.parse(group.date))) {
        return "Invalid Date";
      }
      const date = parseISO(group.date);
      return format(date, "EEEE, MMMM d, yyyy");
    } else {
      // Group by week - ensure weekStart exists and is valid
      if (!group.weekStart || isNaN(Date.parse(group.weekStart))) {
        return "Invalid Week";
      }
      const weekStart = parseISO(group.weekStart);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return `Week of ${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`;
    }
  };

  return (
    <div className="space-y-6">
      {events.map((group, groupIndex) => (
        <div key={groupIndex} className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">{formatGroupTitle(group)}</h3>
            <p className="text-sm text-gray-500 mt-1">
              {group.events.length} event{group.events.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {group.events.map((event) => (
              <div key={event.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">{event.title}</h4>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <Clock className="flex-shrink-0 mr-1.5 h-4 w-4" />
                      {formatEventTime(event.start_time, event.end_time)}
                    </div>
                    {dateRange > 7 && (
                      <div className="mt-1 text-xs text-gray-400">
                        {format(parseISO(event.start_time), "MMM d, yyyy")}
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0 ml-4">
                    {event.google_event_id ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Synced
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Local
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default EventList;
