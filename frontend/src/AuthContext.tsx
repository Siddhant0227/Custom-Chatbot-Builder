// src/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the shape of the AuthContext
interface AuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  login: (username: string, token: string) => void;
  logout: () => void;
  // REMOVED 'user' and 'loading' as they are not managed by this context.
  // If you later add a 'user' object or a 'loading' state related to auth,
  // you would add them here.
}

// Create the AuthContext with a default (null) value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define the AuthProvider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize state from localStorage
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('authToken') ? true : false;
  });
  const [username, setUsername] = useState<string | null>(() => {
    return localStorage.getItem('username') || null;
  });

  // Login function: stores token and username in localStorage
  const login = (newUsername: string, token: string) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('username', newUsername);
    setIsAuthenticated(true);
    setUsername(newUsername);
  };

  // Logout function: removes token and username from localStorage
  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    setUsername(null);
  };

  // Optional: A useEffect to check token validity (e.g., if token expires, logout)
  // For simplicity, we'll omit explicit token validation here, assuming tokens are long-lived
  // or that backend will return 401/403 for invalid tokens.

  return (
    <AuthContext.Provider value={{ isAuthenticated, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};