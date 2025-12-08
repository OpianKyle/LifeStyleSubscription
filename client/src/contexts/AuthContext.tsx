import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@shared/schema';

let memoryAccessToken: string | null = null;

function getStoredToken(): string | null {
  try {
    return localStorage.getItem('opian_access_token');
  } catch (e) {
    console.warn('localStorage not available, using memory storage');
    return memoryAccessToken;
  }
}

function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem('opian_access_token', token);
    } else {
      localStorage.removeItem('opian_access_token');
    }
  } catch (e) {
    console.warn('localStorage not available, using memory storage');
  }
  memoryAccessToken = token;
}

export function getMemoryAccessToken(): string | null {
  return getStoredToken();
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (email: string, password: string, name: string) => Promise<any>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    if (isChecked) return;

    const checkAuth = async () => {
      try {
        const headers: Record<string, string> = {};
        const storedToken = getStoredToken();
        if (storedToken) {
          headers.Authorization = `Bearer ${storedToken}`;
        }
        
        const res = await fetch('/api/auth/user', {
          credentials: 'include',
          headers,
        });
        
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        } else {
          setUser(null);
          setStoredToken(null);
        }
      } catch (error) {
        console.log('Auth check failed:', error);
        setUser(null);
        setStoredToken(null);
      } finally {
        setIsLoading(false);
        setIsChecked(true);
      }
    };

    checkAuth();
  }, [isChecked]);

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error);
    }

    const result = await res.json();
    
    if (result.tokens?.accessToken) {
      setStoredToken(result.tokens.accessToken);
    }
    
    setUser(result.user);
    setIsChecked(true);
    setIsLoading(false);
    
    return result;
  };

  const register = async (email: string, password: string, name: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, name }),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error);
    }

    return res.json();
  };

  const logout = async () => {
    const headers: Record<string, string> = {};
    const currentToken = getStoredToken();
    if (currentToken) {
      headers.Authorization = `Bearer ${currentToken}`;
    }
    
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers,
      });
    } catch (error) {
      console.error('Logout API call failed:', error);
    }
    
    setUser(null);
    setStoredToken(null);
    setIsChecked(true);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      setUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthState() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthState must be used within an AuthProvider');
  }
  return context;
}
