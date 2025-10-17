import React, { useState, useEffect } from "react";
import { Card } from "./Card";
import { useSettingsStore } from "../../store/useSettingsStore";
import { Calendar } from "lucide-react";
import { CardComponentProps } from "../../types/cardProps";

interface CalendarEvent {
  uid: string;
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  location?: string;
  description?: string;
  all_day?: boolean;
}

interface CalendarCardSpecificProps {
  title: string;
  width?: string;
  height?: string;
}

type CalendarCardProps = CardComponentProps<CalendarCardSpecificProps>;

export const CalendarCard: React.FC<CalendarCardProps> = ({
  title,
  entityId,
  onTitleChange,
  onJsonSave,
  onCardDelete,
  cardConfig,
  className,
  width = "w-full",
  height = "h-full",
}) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { homeAssistantIP, homeAssistantToken } = useSettingsStore.getState();

        if (!homeAssistantIP || !homeAssistantToken) {
          setEvents([]);
          setLoading(false);
          return;
        }

        const baseUrl = homeAssistantIP.startsWith("http") ? homeAssistantIP : `https://${homeAssistantIP}`;
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);

        const startParam = startDate.toISOString().split("T")[0] + "T00:00:00";
        const endParam = endDate.toISOString().split("T")[0] + "T23:59:59";

        const apiUrl = `${baseUrl}/api/calendars/${entityId}?start=${startParam}&end=${endParam}`;

        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${homeAssistantToken}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (Array.isArray(result)) {
          const calendarEvents: CalendarEvent[] = result.map((event: any) => ({
            uid: event.uid || `rest-${Date.now()}-${Math.random()}`,
            summary: event.summary || "Untitled Event",
            start: {
              dateTime: event.start?.dateTime,
              date: event.start?.date,
            },
            end: {
              dateTime: event.end?.dateTime,
              date: event.end?.date,
            },
            location: event.location,
            description: event.description,
            all_day: event.start?.date ? true : false,
          }));

          setEvents(calendarEvents);
        } else {
          setEvents([]);
        }
      } catch (error) {
        console.error("Error fetching calendar events:", error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
    const interval = setInterval(fetchEvents, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [entityId]);

  // Update component every minute to refresh active event highlighting
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60 * 1000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const getUpcomingEvents = () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return events
      .filter((event) => {
        const eventDate = new Date(event.start.dateTime || event.start.date || "");
        const eventDayStart = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
        return eventDayStart >= todayStart;
      })
      .sort((a, b) => {
        const dateA = new Date(a.start.dateTime || a.start.date || "");
        const dateB = new Date(b.start.dateTime || b.start.date || "");
        return dateA.getTime() - dateB.getTime();
      });
  };

  const groupEventsByDate = () => {
    const upcomingEvents = getUpcomingEvents();
    const grouped: { [key: string]: CalendarEvent[] } = {};

    upcomingEvents.forEach((event) => {
      const eventDate = new Date(event.start.dateTime || event.start.date || "");
      const dateKey = eventDate.toDateString();

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });

    return grouped;
  };

  const getEventColor = (index: number) => {
    const colors = [
      "bg-gradient-to-r from-slate-600/80 to-slate-700/80",
      "bg-gradient-to-r from-emerald-600/80 to-emerald-700/80",
      "bg-gradient-to-r from-violet-600/80 to-violet-700/80",
      "bg-gradient-to-r from-amber-600/80 to-amber-700/80",
      "bg-gradient-to-r from-rose-600/80 to-rose-700/80",
      "bg-gradient-to-r from-teal-600/80 to-teal-700/80",
      "bg-gradient-to-r from-indigo-600/80 to-indigo-700/80",
    ];
    return colors[index % colors.length];
  };

  const formatTimelineDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const dayName = date.toLocaleDateString("de-DE", { weekday: "short" }).toLowerCase();
    return { day, dayName };
  };

  const formatTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatEventTime = (event: CalendarEvent) => {
    if (event.start.dateTime) {
      return formatTime(event.start.dateTime);
    }
    return event.all_day ? "Ganztägig" : "";
  };

  const isEventActive = (event: CalendarEvent) => {
    const now = new Date();
    const startDate = new Date(event.start.dateTime || event.start.date || "");
    const endDate = new Date(event.end.dateTime || event.end.date || "");

    return now >= startDate && now <= endDate;
  };

  const groupedEvents = groupEventsByDate();

  if (loading) {
    return (
      <Card
        title={title}
        icon={<Calendar className="w-5 h-5" />}
        onTitleChange={onTitleChange}
        onJsonSave={onJsonSave}
        onCardDelete={onCardDelete}
        cardConfig={cardConfig}
        className={className}
        width={width}
        height={height}
      >
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={title}
      icon={<Calendar className="w-5 h-5" />}
      onTitleChange={onTitleChange}
      onJsonSave={onJsonSave}
      onCardDelete={onCardDelete}
      cardConfig={cardConfig}
      className={className}
      width={width}
      height={height}
    >
      <div className="h-full flex flex-col">
        {/* Compact Events */}
        <div className="flex-1 space-y-1 overflow-y-auto min-h-0">
          {Object.keys(groupedEvents).length === 0 ? (
            <div className="text-center text-gray-500 text-xs py-3">
              <Calendar className="w-4 h-4 mx-auto mb-1 text-gray-600" />
              Keine Termine
            </div>
          ) : (
            Object.entries(groupedEvents).map(([dateString, dayEvents]) => {
              const { day, dayName } = formatTimelineDate(dateString);
              return (
                <div key={dateString} className="flex items-start gap-3">
                  {/* Compact Date marker */}
                  <div className="flex-shrink-0 text-right min-w-0 w-10">
                    <div className="text-gray-200 font-bold text-xs leading-tight bg-gray-700/50 rounded px-2 py-1 text-center">{day}</div>
                    <div className="text-gray-500 text-xs leading-tight mt-0.5 font-medium uppercase">{dayName}</div>
                  </div>

                  {/* Compact Events for this date */}
                  <div className="flex-1 space-y-1">
                    {dayEvents.map((event, eventIndex) => {
                      const isActive = isEventActive(event);
                      return (
                        <div
                          key={event.uid || eventIndex}
                          className={`${isActive ? "bg-gradient-to-r from-blue-600/70 to-blue-700/70" : getEventColor(eventIndex)} rounded-lg p-2 shadow-sm`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <h4
                                className={`font-medium text-xs truncate ${
                                  isActive || eventIndex === 0 || eventIndex === 2 || eventIndex === 4 ? "text-white" : "text-gray-800"
                                }`}
                              >
                                {event.summary}
                              </h4>
                              {event.location && (
                                <div className="flex items-center mt-0.5">
                                  <div
                                    className={`w-1 h-1 rounded-full mr-1 ${
                                      isActive || eventIndex === 0 || eventIndex === 2 || eventIndex === 4 ? "bg-white/60" : "bg-gray-600"
                                    }`}
                                  />
                                  <p
                                    className={`text-xs truncate ${
                                      isActive || eventIndex === 0 || eventIndex === 2 || eventIndex === 4 ? "text-white/80" : "text-gray-600"
                                    }`}
                                  >
                                    {event.location}
                                  </p>
                                </div>
                              )}
                            </div>
                            {formatEventTime(event) && (
                              <div
                                className={`text-xs font-medium ml-1 px-1.5 py-0.5 rounded ${
                                  isActive
                                    ? "text-white bg-white/30"
                                    : eventIndex === 0 || eventIndex === 2 || eventIndex === 4
                                    ? "text-white bg-white/20"
                                    : "text-gray-800 bg-gray-200"
                                }`}
                              >
                                {formatEventTime(event)}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Card>
  );
};
