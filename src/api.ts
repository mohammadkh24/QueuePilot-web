
import axios from 'axios';
import { showError } from './utils/toast';

export const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:3000'
).replace(/\/$/, '');

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add access token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('qp_access_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Refresh token management
let refreshing: Promise<string | null> | null = null;

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const original = error.config;

    if (
      error.response?.status !== 401 ||
      !original ||
      original._retry ||
      original.url?.includes('/auth/refresh')
    ) {
      const message = getErrorMessage(error);
      showError(message);

      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem('qp_refresh_token');

    if (!refreshToken) {
      showError(getErrorMessage(error));
      return Promise.reject(error);
    }

    original._retry = true;

    refreshing ||= axios
      .post(`${API_URL}/auth/refresh`, { refreshToken })
      .then((res) => {
        const tokens = res.data?.data;

        if (!tokens?.accessToken || !tokens?.refreshToken) {
          throw new Error('توکن تازه دریافت نشد.');
        }

        localStorage.setItem('qp_access_token', tokens.accessToken);
        localStorage.setItem('qp_refresh_token', tokens.refreshToken);

        return tokens.accessToken as string;
      })
      .catch(() => {
        localStorage.removeItem('qp_access_token');
        localStorage.removeItem('qp_refresh_token');

        return null;
      })
      .finally(() => {
        refreshing = null;
      });

    const token = await refreshing;

    if (!token) {
      showError('نشست شما منقضی شده است. لطفاً دوباره وارد شوید.');
      return Promise.reject(error);
    }

    original.headers.Authorization = `Bearer ${token}`;

    return api(original);
  },
);

// Extract backend error messages
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data;

    const message =
      responseData?.error?.data?.message ||
      responseData?.message ||
      responseData?.error?.message;

    if (Array.isArray(message)) {
      return message.join('، ');
    }

    return message || 'ارتباط با سرور برقرار نشد.';
  }

  return error instanceof Error
    ? error.message
    : 'خطای نامشخصی رخ داد.';
}

// Unwrap API response
export function unwrap<T>(
  response: { data: { data: T } },
): T {
  return response.data.data;
}
