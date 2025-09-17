import { useState, useEffect } from 'react';
import { User } from '@shared/schema';

// Token storage for Replit iframe compatibility
// Use localStorage with memory fallback for cross-session persistence
let memoryAccessToken: string | null = null;

// Safe localStorage access with fallback
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

// Export function to access token from other modules
export function getMemoryAccessToken(): string | null {
  return getStoredToken();
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
          // Clear invalid token
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
    setUser(result.user);
    
    // Store access token with localStorage persistence for iframe compatibility
    if (result.tokens?.accessToken) {
      setStoredToken(result.tokens.accessToken);
    }
    
    // Force a re-check of authentication state to ensure immediate UI update
    setIsChecked(false);
    
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
    
    // Clear all authentication state thoroughly
    setUser(null);
    setStoredToken(null); // Clear stored token
    setIsChecked(false); // Allow re-authentication check  
    setIsLoading(true); // Set loading to true to prevent flash of content
    
    // Force a complete state reset by triggering auth check
    setTimeout(() => {
      setIsLoading(false);
    }, 100);
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