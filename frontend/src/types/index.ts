export interface User {
  id: number;
  google_id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: number;
  user_id: number;
  google_event_id?: string;
  title: string;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
}

export interface GroupedEvents {
  date?: string;
  weekStart?: string;
  events: Event[];
}

export interface EventsResponse {
  events: GroupedEvents[];
  dateRange: {
    startDate: string;
    endDate: string;
    days: number;
  };
}

export interface CreateEventData {
  title: string;
  start_time: string;
  end_time: string;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
  token: string | null;
}

export type DateRange = 1 | 7 | 30;
