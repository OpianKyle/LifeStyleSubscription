import { useState, useEffect } from 'react';
import { User } from '@shared/schema';

// In-memory token storage for Replit iframe compatibility
let memoryAccessToken: string | null = null;

// Export function to access memory token from other modules
export function getMemoryAccessToken(): string | null {
  return memoryAccessToken;
}

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    if (isChecked) return;

    const checkAuth = async () => {
      try {
        // Try with cookies first, then with Authorization header if available
        const headers: Record<string, string> = {};
        if (memoryAccessToken) {
          headers.Authorization = `Bearer ${memoryAccessToken}`;
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
          // Clear invalid token
          memoryAccessToken = null;
        }
      } catch (error) {
        console.log('Auth check failed:', error);
        setUser(null);
        memoryAccessToken = null;
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
    setUser(result.user);
    
    // Store access token in memory for Authorization header fallback
    if (result.tokens?.accessToken) {
      memoryAccessToken = result.tokens.accessToken;
    }
    
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
    if (memoryAccessToken) {
      headers.Authorization = `Bearer ${memoryAccessToken}`;
    }
    
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers,
    });
    
    setUser(null);
    memoryAccessToken = null; // Clear memory token
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    setUser,
  };
}