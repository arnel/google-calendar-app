import axios from "axios";
import { EventsResponse, CreateEventData, DateRange } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  getGoogleAuthUrl: () => `${API_BASE_URL}/auth/google`,

  refreshToken: async (refreshToken: string) => {
    const response = await api.post("/auth/refresh", { refreshToken });
    return response.data;
  },
};

export const eventsApi = {
  getEvents: async (days: DateRange = 7, startDate?: string): Promise<EventsResponse> => {
    const params = new URLSearchParams();
    params.append("days", days.toString());
    if (startDate) {
      params.append("startDate", startDate);
    }

    const response = await api.get(`/api/events?${params}`);
    return response.data;
  },

  createEvent: async (eventData: CreateEventData) => {
    const response = await api.post("/api/events", eventData);
    return response.data;
  },

  refreshEvents: async () => {
    const response = await api.post("/api/events/refresh");
    return response.data;
  },
};

export default api;
