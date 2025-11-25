import axios, { AxiosRequestConfig } from 'axios';
import { merge, set } from 'lodash';
import queryString from 'query-string';

const instance = axios.create({
  withCredentials: true,
  paramsSerializer: (params: { [s: string]: unknown } | ArrayLike<unknown>) => {
    const filteredParams = Object.fromEntries(Object.entries(params).filter(([_k, v]) => v));
    return queryString.stringify(filteredParams, { arrayFormat: 'bracket' });
  },
});

export default class BaseHttpService {
  private BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

  private accessToken: string | null = '';

  private router: any;

  private isRefreshing: boolean = false;

  private refreshRequestQueue: Array<(ok: boolean) => void> = [];

  constructor(router?: any) {
    this.router = router;
  }

  async get(endpoint: string, options: AxiosRequestConfig = {}, getRawResponse: boolean = false): Promise<any> {
    merge(options, this.getCommonOptions());
    const fullUrl = endpoint.includes('http') ? endpoint : `${this.BASE_URL}${endpoint}`;
    return getRawResponse
      ? instance.get(fullUrl, options)
      : instance.get(fullUrl, options).catch((error: any) => this.handleHttpError(error));
  }

  async post(
    endpoint: string,
    data = {},
    options: AxiosRequestConfig = {},
    getRawResponse: boolean = false
  ): Promise<any> {
    merge(options, this.getCommonOptions());
    const fullUrl = endpoint.includes('http') ? endpoint : `${this.BASE_URL}${endpoint}`;
    return getRawResponse
      ? instance.post(fullUrl, data, options)
      : instance.post(fullUrl, data, options).catch((error: any) => this.handleHttpError(error));
  }

  async put(
    endpoint: string,
    data = {},
    options: AxiosRequestConfig = {},
    getRawResponse: boolean = false
  ): Promise<any> {
    merge(options, this.getCommonOptions());
    return getRawResponse
      ? instance.put(`${this.BASE_URL}${endpoint}`, data, options)
      : instance.put(`${this.BASE_URL}${endpoint}`, data, options).catch((error: any) => this.handleHttpError(error));
  }

  async delete(endpoint: string, options: AxiosRequestConfig = {}, getRawResponse: boolean = false): Promise<any> {
    merge(options, this.getCommonOptions());
    return getRawResponse
      ? instance.delete(`${this.BASE_URL}${endpoint}`, options)
      : instance.delete(`${this.BASE_URL}${endpoint}`, options).catch((error: any) => this.handleHttpError(error));
  }

  async patch(
    endpoint: string,
    data = {},
    options: AxiosRequestConfig = {},
    getRawResponse: boolean = false
  ): Promise<any> {
    merge(options, this.getCommonOptions());
    return getRawResponse
      ? instance.patch(`${this.BASE_URL}${endpoint}`, data, options)
      : instance.patch(`${this.BASE_URL}${endpoint}`, data, options).catch((error: any) => this.handleHttpError(error));
  }

  handleHttpError(error: any): any {
    if (axios.isAxiosError(error) && !error?.response?.data) {
      set(error, 'response.data', {
        statusCode: error?.response?.status ?? 500,
        message: error.message,
      });
    }
    const { statusCode, message } = error?.response?.data ?? {};
    const httpStatus = error?.response?.status;
    const resolvedMessage =
      error?.response?.data?.detail?.[0]?.msg ||
      error?.response?.data?.detail ||
      message ||
      error?.message ||
      'Unknown Error';

    // Non-401: Bubble up an error
    if (httpStatus !== 401 && statusCode !== 401) {
      throw new Error(resolvedMessage);
    }

    // Avoid infinite loop on refresh/login endpoints
    const originalRequest = error?.config ?? {};
    const requestUrl = originalRequest?.url || '';
    // For login endpoint, bubble up server-provided message (do not attempt refresh)
    if (/\/auth\/login$/.test(requestUrl)) {
      return Promise.reject(new Error(resolvedMessage));
    }
    // Avoid infinite loop: if this is a retried request, bubble up the actual error
    if (originalRequest?.__isRetryRequest) {
      return Promise.reject(new Error(resolvedMessage));
    }
    // If refresh itself failed, instruct user to log in again
    if (/\/auth\/refresh$/.test(requestUrl)) {
      return Promise.reject(new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.'));
    }

    // Queue requests while we refresh
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.refreshRequestQueue.push((ok: boolean) => {
          if (ok) {
            try {
              originalRequest.__isRetryRequest = true;
              resolve(instance.request(originalRequest));
            } catch (e) {
              reject(e);
            }
          } else {
            reject(error);
          }
        });
      });
    }

    this.isRefreshing = true;
    return this.refreshSession()
      .then((ok) => {
        this.isRefreshing = false;
        this.refreshRequestQueue.forEach((cb) => cb(ok));
        this.refreshRequestQueue = [];
        if (ok) {
          originalRequest.__isRetryRequest = true;
          return instance.request(originalRequest);
        }
        return Promise.reject(new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại..'));
      })
      .catch(() => {
        this.isRefreshing = false;
        this.refreshRequestQueue.forEach((cb) => cb(false));
        this.refreshRequestQueue = [];
        return Promise.reject(new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.'));
      });
  }

  handle401(): void {
    // No navigation here; guards decide. Intentionally a no-op.
  }

  getCommonOptions(): Record<string, unknown> {
    // Using httpOnly cookies; no Authorization header
    const options: Record<string, any> = {
      withCredentials: true,
      headers: {},
    };

    // Read locale from cookie and send it to backend
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';');
      const localeCookie = cookies.find((c) => c.trim().startsWith('NEXT_LOCALE='));
      if (localeCookie) {
        const locale = localeCookie.split('=')[1];
        // TODO: Send locale to backend via Accept-Language header (standard HTTP header)
        options.headers['Accept-Language'] = locale;
      }
    }

    return options;
  }

  get newAccessToken(): string | null {
    return this.accessToken ?? null;
  }

  saveToken(newAccessToken: string): any {
    this.accessToken = newAccessToken;
    return undefined;
  }

  loadToken(): string | null {
    this.accessToken = null;
    return null;
  }

  static removeToken(): void {
    // Tokens handled by cookies now
  }

  private async refreshSession(): Promise<boolean> {
    try {
      const url = `${this.BASE_URL}/auth/refresh`;
      await instance.post(url, {}, { withCredentials: true });
      return true;
    } catch (_e) {
      return false;
    }
  }
}

export const baseHttpServiceInstance = new BaseHttpService();
