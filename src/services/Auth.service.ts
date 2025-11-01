import { AxiosResponse } from 'axios';

import { AuthRes, LoginReq, SignUpReq, SsoAuthRes } from '@/types/auth';

import BaseHttpService from './BaseHttp.service';

class AuthService extends BaseHttpService {
  async register(data: SignUpReq): Promise<AxiosResponse<AuthRes>> {
    return this.post(`/auth/register`, data);
  }

  // Example of using withCredentials: true in an Axios request.
  // This ensures that cookies (such as session cookies) are sent and received with the request.
  async login(data: LoginReq): Promise<AxiosResponse<AuthRes>> {
    return this.post(
      `/auth/login`,
      data,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        // withCredentials: true tells Axios to send cookies with the request
        withCredentials: true
      }
    );
  }

  async ssoLogin(data: LoginReq): Promise<AxiosResponse<SsoAuthRes>> {
    return this.post(`/sso/login`, data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  async refreshToken(refreshToken: string): Promise<any> {
    return this.post(
      `/auth/refresh`,
      {},
      {
        params: {
          refreshToken: refreshToken,
        },
      }
    );
  }

  async logout(): Promise<void> {
    return this.post(
      `/auth/logout`,
      {},
      {
        // Cookies handle tokens server-side
      }
    );
  }

  async verify(data: { email: string; otp: string }): Promise<AxiosResponse<AuthRes>> {
    return this.post(`/auth/verify-otp`, data);
  }

  async resendOtp(email: string): Promise<void> {
    return this.post(`/auth/resend-otp`, { email });
  }

  async me() {
    try {
      const response = await this.get('/auth/me');
      return response.data;
    } catch (error) {
      return null;
    }
  }

  async meSso() {
    try {
      const response = await this.get('/sso/me');
      return response.data;
    } catch (error) {
      return null;
    }
  }
}

export default new AuthService();
