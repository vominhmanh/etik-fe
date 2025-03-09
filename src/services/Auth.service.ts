import { AxiosResponse } from 'axios';

import { AuthRes, LoginReq, SignUpReq, SsoAuthRes } from '@/types/auth';

import BaseHttpService from './BaseHttp.service';

class AuthService extends BaseHttpService {
  async register(data: SignUpReq): Promise<AxiosResponse<AuthRes>> {
    return this.post(`/auth/register`, data);
  }

  async login(data: LoginReq): Promise<AxiosResponse<AuthRes>> {
    return this.post(`/auth/login`, data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
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
        params: {
          refreshToken: localStorage.getItem('refreshToken'),
        },
      }
    );
  }

  async verify(data: { email: string; otp: string }): Promise<AxiosResponse<AuthRes>> {
    return this.post(`/auth/verify-otp`, data);
  }

  async resendOtp(email: string): Promise<void> {
    return this.post(`/auth/resend-otp`, { email });
  }

  async verifyAccessToken(accessToken: string) {
    try {
      const response = await this.get('/auth/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data;
    } catch (error) {
      return null;
    }

  }

  async verifyAccessTokenSso(accessToken: string) {
    try {
      const response = await this.get('/sso/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data;
    } catch (error) {
      return null;
    }

  }
}

export default new AuthService();
