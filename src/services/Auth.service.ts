import { AxiosResponse } from 'axios';

import { AuthRes, LoginReq, SignUpReq } from '@/types/auth';

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
}

export default new AuthService();
