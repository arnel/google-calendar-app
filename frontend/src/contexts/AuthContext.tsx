import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AuthContextType, User } from "../types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for token in URL (from OAuth callback)
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get("token");
    const error = urlParams.get("error");

    if (error) {
      console.error("OAuth error:", error);
      setLoading(false);
      return;
    }

    if (urlToken) {
      login(urlToken);
      // Clean up URL and redirect to dashboard
      window.history.replaceState({}, document.title, "/dashboard");
      return;
    }

    // Check for stored token
    const storedToken = localStorage.getItem("authToken");
    if (storedToken) {
      try {
        // Verify token is not expired
        const payload = JSON.parse(atob(storedToken.split(".")[1]));
        const currentTime = Math.floor(Date.now() / 1000);

        if (payload.exp && payload.exp > currentTime) {
          setToken(storedToken);
          setIsAuthenticated(true);
          setUser({
            id: payload.userId,
            google_id: "",
            email: "",
            name: "",
            created_at: "",
            updated_at: "",
          });
        } else {
          // Token expired, remove it
          localStorage.removeItem("authToken");
        }
      } catch (error) {
        console.error("Error validating stored token:", error);
        localStorage.removeItem("authToken");
      }
    }

    setLoading(false);
  }, []);

  const login = (newToken: string) => {
    setToken(newToken);
    setIsAuthenticated(true);
    localStorage.setItem("authToken", newToken);

    // Decode JWT to get user info (in a real app, make an API call)
    try {
      const payload = JSON.parse(atob(newToken.split(".")[1]));
      // For simplicity, we'll set a basic user object
      setUser({
        id: payload.userId,
        google_id: "",
        email: "",
        name: "",
        created_at: "",
        updated_at: "",
      });
    } catch (error) {
      console.error("Error decoding token:", error);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("authToken");
  };

  const value: AuthContextType = {
    isAuthenticated,
    user,
    login,
    logout,
    token,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
