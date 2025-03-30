import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { auth } from "./firebase";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  isFormData: boolean = false,
): Promise<Response> {
  // Setup request configuration
  const config: RequestInit = {
    method,
    credentials: "include",
    headers: {},
  };

  // Add dev user ID and Firebase UID if it exists in localStorage
  const devUser = localStorage.getItem('dev-user');
  if (devUser) {
    try {
      const userData = JSON.parse(devUser);
      if (userData && userData.id) {
        // Add for development auth - this will ensure token works in verifyAuthToken
        config.headers = {
          ...config.headers,
          'X-Dev-User-ID': userData.id.toString(),
          'Authorization': `Bearer ${userData.firebaseUid || 'test-' + userData.id}`
        };
        console.log('Found development user in localStorage:', userData);
      }
    } catch (e) {
      console.error('Failed to parse dev user from localStorage:', e);
    }
  }
  
  // If Firebase auth is used, add the token to the headers
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken();
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`
      };
    }
  } catch (e) {
    console.error('Failed to get Firebase token:', e);
  }

  // Handle the body and headers based on data type
  if (data) {
    if (isFormData || data instanceof FormData) {
      // FormData - don't set Content-Type (browser will handle it)
      config.body = data as FormData;
    } else {
      config.headers = {
        ...config.headers,
        "Content-Type": "application/json"
      };
      config.body = JSON.stringify(data);
    }
  }

  const res = await fetch(url, config);

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const config: RequestInit = {
      credentials: "include",
      headers: {},
    };

    // Add dev user ID and Firebase UID if it exists in localStorage
    const devUser = localStorage.getItem('dev-user');
    if (devUser) {
      try {
        const userData = JSON.parse(devUser);
        if (userData && userData.id) {
          // Add for development auth - this will ensure token works in verifyAuthToken
          config.headers = {
            ...config.headers,
            'X-Dev-User-ID': userData.id.toString(),
            'Authorization': `Bearer ${userData.firebaseUid || 'test-' + userData.id}`
          };
          console.log('Found development user in localStorage:', userData);
        }
      } catch (e) {
        console.error('Failed to parse dev user from localStorage:', e);
      }
    }

    // If Firebase auth is used, add the token to the headers
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const token = await currentUser.getIdToken();
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${token}`
        };
      }
    } catch (e) {
      console.error('Failed to get Firebase token:', e);
    }

    const res = await fetch(queryKey[0] as string, config);

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
