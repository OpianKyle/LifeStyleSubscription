import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getMemoryAccessToken } from "@/contexts/AuthContext";

// Flag to prevent infinite loops during token handling
let isHandlingAuth = false;

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Handle 401 errors - only redirect if token was expected to work
function handleUnauthorized(): void {
  if (isHandlingAuth) return;
  
  const currentPath = window.location.pathname;
  
  // Don't handle auth errors on auth-related pages
  if (currentPath.includes('/auth') || currentPath.includes('/verify-email')) {
    return;
  }
  
  // Check if we have a token - if not, this is expected (unauthenticated user)
  let hasToken = false;
  try {
    hasToken = !!localStorage.getItem('opian_access_token');
  } catch (e) {
    // Ignore localStorage errors
  }
  
  // Only clear and redirect if we had a token that's now invalid
  if (!hasToken) {
    return; // No token = expected 401, don't redirect
  }
  
  isHandlingAuth = true;
  
  try {
    // Clear invalid tokens from localStorage
    localStorage.removeItem('opian_access_token');
  } catch (e) {
    // Ignore localStorage errors
  }
  
  // Redirect to auth page
  window.location.replace('/auth');
  
  // Reset flag after a delay
  setTimeout(() => {
    isHandlingAuth = false;
  }, 1000);
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<any> {
  const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};
  
  // Add Authorization header if token is available
  const token = getMemoryAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  // Handle 401 errors by clearing tokens and redirecting
  if (res.status === 401) {
    handleUnauthorized();
    throw new Error('401: Authentication required');
  }

  await throwIfResNotOk(res);
  return await res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const headers: Record<string, string> = {};
    
    // Add Authorization header if token is available
    const token = getMemoryAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
      headers,
    });

    // Handle 401 errors based on behavior
    if (res.status === 401) {
      if (unauthorizedBehavior === "returnNull") {
        handleUnauthorized();
        return null;
      }
      
      handleUnauthorized();
      throw new Error('401: Authentication required');
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
