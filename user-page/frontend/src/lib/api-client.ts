const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8003';

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

// Auth state sync callback (registered by auth-store to avoid circular imports)
let onAuthCleared: (() => void) | null = null;

export function setAuthCallbacks(callbacks: {
  onCleared: () => void;
}) {
  onAuthCleared = callbacks.onCleared;
}

// Mutex to prevent concurrent refresh requests
let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = doRefresh();
  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

async function doRefresh(): Promise<boolean> {
  try {
    // Cookie is sent automatically via credentials: 'include'
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    return res.ok;
  } catch {
    return false;
  }
}

function clearAuth() {
  onAuthCleared?.();
  // AuthGuard handles redirect to /login when isAuthenticated becomes false
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { params, ...init } = options;
    let url = `${this.baseUrl}${path}`;

    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((init.headers as Record<string, string>) || {}),
    };

    // HttpOnly cookies are sent automatically via credentials: 'include'
    let response = await fetch(url, { ...init, headers, credentials: 'include' });

    // Auto-refresh on 401
    if (response.status === 401) {
      const refreshed = await tryRefresh();
      if (refreshed) {
        response = await fetch(url, { ...init, headers, credentials: 'include' });
      } else {
        clearAuth();
        throw new Error('세션이 만료되었습니다');
      }
    }

    if (!response.ok) {
      let errorMsg = `HTTP ${response.status}`;
      try {
        const errorBody = await response.json();
        errorMsg = errorBody.message || errorBody.error || errorMsg;
      } catch {
        // Response body is not JSON
      }
      throw new Error(errorMsg);
    }

    if (response.status === 204) return {} as T;

    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Invalid JSON response from ${path}`);
    }
  }

  get<T>(path: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>(path, { method: 'GET', params });
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
  }

  put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined });
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }
}

export const api = new ApiClient(API_URL);
