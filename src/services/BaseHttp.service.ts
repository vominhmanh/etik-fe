import axios, { AxiosRequestConfig } from 'axios';
import { merge, set } from 'lodash';
import queryString from 'query-string';

const instance = axios.create({
  paramsSerializer: (params: { [s: string]: unknown } | ArrayLike<unknown>) => {
    const filteredParams = Object.fromEntries(Object.entries(params).filter(([_k, v]) => v));
    return queryString.stringify(filteredParams, { arrayFormat: 'bracket' });
  },
});

export default class BaseHttpService {
  private BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

  private accessToken: string | null = '';

  private router: any;

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
    if (statusCode !== 401) {
      throw new Error(
        error.response?.data?.detail?.[0]?.msg ||
        error.response?.data?.detail ||
        message ||
        error.message ||
        'Unknown Error',
      );
    } else {
      return this.handle401();
    }
  }

  handle401(): void {
    // Unauthorized -> Push to sign in page
    if (this.router) {
      this.router.push('/sign-in');
    }
  }

  getCommonOptions(): {
    headers?: {
      Authorization: string;
    };
  } {
    if (typeof window !== 'undefined') {
      const token = this.loadToken();
      return {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
    }
    return {};
  }

  get newAccessToken(): string | null {
    return this.accessToken ? this.accessToken : this.loadToken();
  }

  saveToken(newAccessToken: string): any {
    this.accessToken = newAccessToken;
    return localStorage.setItem('accessToken', newAccessToken);
  }

  loadToken(): string | null {
    const token = localStorage.getItem('accessToken');
    this.accessToken = token;
    return token;
  }

  static removeToken(): void {
    localStorage.removeItem('accessToken');
  }
}

export const baseHttpServiceInstance = new BaseHttpService();
