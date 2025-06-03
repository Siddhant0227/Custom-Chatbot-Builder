// Example of how your AuthContext.tsx might need to be structured
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string) => void; // login function should accept username
  logout: () => void;
  username: string | null; // Add username to the context type
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null); // State to hold the username

  const login = (user: string) => {
    setIsAuthenticated(true);
    setCurrentUsername(user); // Store the username when logging in
    // You might also store tokens or user data in localStorage/sessionStorage here
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUsername(null); // Clear username on logout
    // Clear any stored tokens/user data
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, username: currentUsername }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};