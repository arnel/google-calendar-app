import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Calendar, LogIn } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { authApi } from "../services/api";

const LoginPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Check for error in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get("error");

    if (error) {
      console.error("Authentication error:", error);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleGoogleLogin = () => {
    window.location.href = authApi.getGoogleAuthUrl();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary-500 rounded-full flex items-center justify-center">
            <Calendar className="h-6 w-6" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Calendar Manager</h2>
          <p className="mt-2 text-sm text-gray-600">Connect your Google Calendar to manage your events</p>
        </div>

        <div className="mt-8 space-y-6">
          <div>
            <button
              onClick={handleGoogleLogin}
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <LogIn className="h-5 w-5 text-primary-300 group-hover:text-primary-200" />
              </span>
              Sign in with Google
            </button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              By signing in, you agree to allow this application to access your Google Calendar data. We will only read
              and create events as requested.
            </p>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-3">What you can do:</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center">
              <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
              View your calendar events
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
              Create new events
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
              Filter events by date range
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
              Sync with Google Calendar
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
