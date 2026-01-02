import { useCallback, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from '@/contexts/locale-context';
import axios from 'axios';

export interface SSOConfig {
  enabled: boolean;
  onLoginSuccess?: () => void;
  onLoginError?: (error: string) => void;
}

// Utility function to refresh token silently
export async function refreshSSOToken(): Promise<{ access_token: string; refresh_token: string } | null> {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return null;
    }

    const apiUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://api.etik.vn';
    const response = await axios.post(
      `${apiUrl}/sso/refresh`,
      { refresh_token: refreshToken },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data && response.data.access_token && response.data.refresh_token) {
      // Update tokens in localStorage
      localStorage.setItem('accessToken', response.data.access_token);
      localStorage.setItem('refreshToken', response.data.refresh_token);
      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
      };
    }
    return null;
  } catch (error) {
    console.error('Failed to refresh SSO token:', error);
    // Clear tokens on refresh failure
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    return null;
  }
}

// Setup axios interceptor for automatic token refresh
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

const onRefreshed = (token: string) => {
  refreshSubscribers.map((cb) => cb(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

// Configure axios interceptor
if (typeof window !== 'undefined') {
  axios.interceptors.request.use(
    (config) => {
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken && config.headers) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // If error is 401 and we haven't tried to refresh yet
      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          // If already refreshing, wait for the new token
          return new Promise((resolve) => {
            addRefreshSubscriber((token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(axios(originalRequest));
            });
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const tokens = await refreshSSOToken();
          if (tokens) {
            onRefreshed(tokens.access_token);
            originalRequest.headers.Authorization = `Bearer ${tokens.access_token}`;
            return axios(originalRequest);
          } else {
            // Refresh failed, redirect to login
            window.location.href = '/auth/login';
            return Promise.reject(error);
          }
        } catch (refreshError) {
          isRefreshing = false;
          onRefreshed('');
          window.location.href = '/auth/login';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );
}

export function useSSO(config?: SSOConfig) {
  const router = useRouter();
  const pathname = usePathname();
  const { locale } = useLocale();
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleSSOLogin = useCallback(() => {
    if (!config?.enabled) {
      return;
    }

    // Get returnUrl based on current pathname, preserving locale
    const currentPath = pathname || '/dashboard';
    const returnUrl = currentPath.startsWith('/en') 
      ? currentPath 
      : (locale === 'en' ? `/en${currentPath}` : currentPath);
    
    // Redirect to SSO Google OAuth endpoint
    const apiUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://api.etik.vn';
    window.location.href = `${apiUrl}/sso/login/google?returnUrl=${encodeURIComponent(returnUrl)}`;
  }, [config, pathname, locale]);

  // Setup automatic token refresh before expiration
  useEffect(() => {
    const setupTokenRefresh = () => {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        return;
      }

      // Try to decode token to get expiration time (basic check)
      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        const exp = payload.exp * 1000; // Convert to milliseconds
        const now = Date.now();
        const timeUntilExpiry = exp - now;
        
        // Refresh token 5 minutes before expiration
        const refreshTime = Math.max(timeUntilExpiry - 5 * 60 * 1000, 60000); // At least 1 minute

        if (refreshIntervalRef.current) {
          clearTimeout(refreshIntervalRef.current);
        }

        refreshIntervalRef.current = setTimeout(async () => {
          await refreshSSOToken();
          setupTokenRefresh(); // Setup next refresh
        }, refreshTime);
      } catch (e) {
        // If token parsing fails, try to refresh immediately
        refreshSSOToken();
      }
    };

    setupTokenRefresh();

    return () => {
      if (refreshIntervalRef.current) {
        clearTimeout(refreshIntervalRef.current);
      }
    };
  }, []);

  return {
    handleSSOLogin,
    isSSOEnabled: config?.enabled || false,
    refreshToken: refreshSSOToken,
  };
}

