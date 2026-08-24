const API_BASE = '/api';

function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
}

interface RequestOptions extends RequestInit {
  token?: string;
  skipPrefix?: boolean;
}

async function request<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers: customHeaders, skipPrefix, ...rest } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string> || {}),
  };

  const authToken = token || getToken();
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const url = skipPrefix ? path : `${API_BASE}${path}`;
  const res = await fetch(url, { headers, ...rest });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `请求失败: ${res.status}`);
  }

  return data as T;
}

// Generic REST-style API (supports api.get, api.post, etc.)
const api = {
  get: <T = any>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T = any>(path: string, body?: any, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  put: <T = any>(path: string, body?: any, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  delete: <T = any>(path: string, body?: any, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: 'DELETE',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  patch: <T = any>(path: string, body?: any, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  // Named methods for convenience
  register: (data: { email: string; password: string; nickname?: string; teamName?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  getMe: (token: string) => api.get('/auth/me', { token }),
};

export default api;
export { api };
