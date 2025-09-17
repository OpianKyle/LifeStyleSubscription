import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getMemoryAccessToken } from "@/hooks/useAuthState";

// Flag to prevent infinite loops during token handling
let isHandlingAuth = false;

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Handle 401 errors by clearing tokens and redirecting to auth
function handleUnauthorized(): void {
  if (isHandlingAuth) return;
  
  isHandlingAuth = true;
  
  try {
    // Clear invalid tokens from localStorage
    localStorage.removeItem('opian_access_token');
  } catch (e) {
    // Ignore localStorage errors
  }
  
  // Only redirect if not already on auth page to prevent loops
  const currentPath = window.location.pathname;
  if (!currentPath.includes('/auth') && !currentPath.includes('/verify-email')) {
    // Use replace to avoid back button issues
    window.location.replace('/auth');
  }
  
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
