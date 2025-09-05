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
      : instance.get(fullUrl, options)
        .catch((error: any) => this.handleHttpError(error))

  }

  async post(endpoint: string, data = {}, options: AxiosRequestConfig = {}, getRawResponse: boolean = false): Promise<any> {
    merge(options, this.getCommonOptions());
    const fullUrl = endpoint.includes('http') ? endpoint : `${this.BASE_URL}${endpoint}`;
    return getRawResponse
      ? instance.post(fullUrl, data, options)
      : instance.post(fullUrl, data, options)
        .catch((error: any) => this.handleHttpError(error))

  }

  async put(endpoint: string, data = {}, options: AxiosRequestConfig = {}, getRawResponse: boolean = false): Promise<any> {
    merge(options, this.getCommonOptions());
    return getRawResponse
      ? instance.put(`${this.BASE_URL}${endpoint}`, data, options)
      : instance.put(`${this.BASE_URL}${endpoint}`, data, options)
        .catch((error: any) => this.handleHttpError(error))
  }

  async delete(endpoint: string, options: AxiosRequestConfig = {}, getRawResponse: boolean = false): Promise<any> {
    merge(options, this.getCommonOptions());
    return getRawResponse 
    ? instance.delete(`${this.BASE_URL}${endpoint}`, options)
    : instance.delete(`${this.BASE_URL}${endpoint}`, options)
      .catch((error: any) => this.handleHttpError(error))
  }

  async patch(endpoint: string, data = {}, options: AxiosRequestConfig = {}, getRawResponse: boolean = false): Promise<any> {
    merge(options, this.getCommonOptions());
    return getRawResponse 
    ? instance.patch(`${this.BASE_URL}${endpoint}`, data, options)
    : instance.patch(`${this.BASE_URL}${endpoint}`, data, options)
      .catch((error: any) => this.handleHttpError(error))
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

    // Non-401: Bubble up an error
    if (httpStatus !== 401 && statusCode !== 401) {
      throw new Error(
        error.response?.data?.detail?.[0]?.msg ||
        error.response?.data?.detail ||
        message ||
        error.message ||
        'Unknown Error',
      );
    }

    // Avoid infinite loop on refresh/login endpoints
    const originalRequest = error?.config ?? {};
    if (originalRequest?.__isRetryRequest || /\/auth\/refresh$/.test(originalRequest?.url || '') || /\/auth\/login$/.test(originalRequest?.url || '')) {
      return this.handle401();
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
        this.handle401();
        return Promise.reject(new Error('Vui lòng đăng nhập lại'));
      })
      .catch(() => {
        this.isRefreshing = false;
        this.refreshRequestQueue.forEach((cb) => cb(false));
        this.refreshRequestQueue = [];
        this.handle401();
        return Promise.reject(new Error('Vui lòng đăng nhập lại'));
      });
  }

  handle401(): void {
    // Unauthorized -> Push to sign in page
    if (typeof window !== 'undefined') {
      const path = window.location.pathname || '/';
      const search = window.location.search || '';
      const isAuth = /^\/auth(\/|$)/.test(path);
      if (!isAuth) {
        const returnUrl = encodeURIComponent(`${path}${search}`);
        const loginUrl = `/auth/login?returnUrl=${returnUrl}`;
        if (this.router) {
          this.router.push(loginUrl);
        } else {
          if (window.location.pathname + window.location.search !== loginUrl) {
            window.location.href = loginUrl;
          }
        }
      }
      return;
    }
    if (this.router) {
      this.router.push('/auth/login');
    }
  }

  getCommonOptions(): Record<string, unknown> {
    // Using httpOnly cookies; no Authorization header
    return { withCredentials: true };
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
