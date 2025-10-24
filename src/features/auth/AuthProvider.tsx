// src/features/auth/AuthProvider.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as apiLogin } from './api/auth.api';

interface User {
  id: string;
  username: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Decode JWT to get user info (without crypto libraries)
function decodeToken(token: string): User | null {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return {
      id: decoded.user_id,
      username: decoded.username || 'user',
      email: decoded.email,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      const userData = decodeToken(token);
      setUser(userData);
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const { access } = await apiLogin(username, password);
    const userData = decodeToken(access);
    setUser(userData);
  };

  const logout = () => {
    const refresh = localStorage.getItem('refresh_token');
    
    // Call logout endpoint to blacklist token
    if (refresh) {
      fetch('http://localhost:8080/api/logout/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      }).catch(() => {
        // Fail silently - still clear local tokens
      });
    }
    
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for easy access
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}