import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Calendar, RefreshCw, Plus, LogOut, Filter } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { eventsApi } from "../services/api";
import { EventsResponse, DateRange } from "../types";
import EventList from "../components/EventList";
import AddEventForm from "../components/AddEventForm";
import DateRangeSelector from "../components/DateRangeSelector";

const DashboardPage: React.FC = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const [eventsData, setEventsData] = useState<EventsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>(7);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchEvents();
    }
  }, [isAuthenticated, dateRange]);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await eventsApi.getEvents(dateRange);
      setEventsData(data);
    } catch (error: any) {
      console.error("Error fetching events:", error);
      setError("Failed to fetch events. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshEvents = async () => {
    try {
      setRefreshing(true);
      setError(null);
      await eventsApi.refreshEvents();
      await fetchEvents();
    } catch (error: any) {
      console.error("Error refreshing events:", error);
      setError("Failed to refresh events. Please try again.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleEventCreated = () => {
    setShowAddForm(false);
    fetchEvents();
  };

  const handleDateRangeChange = (newRange: DateRange) => {
    setDateRange(newRange);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200/70 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-2 rounded-xl mr-3">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Calendar Manager</h1>
                {user && <p className="text-xs text-gray-500">Welcome back!</p>}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button onClick={() => setShowAddForm(true)} className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </button>

              <button onClick={handleRefreshEvents} disabled={refreshing} className="btn-secondary">
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>

              <button
                onClick={logout}
                className="inline-flex items-center px-4 py-2.5 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="card p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-primary-600" />
                <span className="text-sm font-medium text-gray-700">Date Range:</span>
              </div>
              <DateRangeSelector currentRange={dateRange} onChange={handleDateRangeChange} />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-4 animate-fade-in">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-1 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Events */}
        {loading ? (
          <div className="card p-12 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4"></div>
              <span className="text-gray-600 text-lg">Loading your events...</span>
              <p className="text-gray-500 mt-2">This may take a moment</p>
            </div>
          </div>
        ) : (
          <EventList eventsData={eventsData} dateRange={dateRange} />
        )}
      </main>

      {/* Add Event Modal */}
      {showAddForm && <AddEventForm onClose={() => setShowAddForm(false)} onEventCreated={handleEventCreated} />}
    </div>
  );
};

export default DashboardPage;
