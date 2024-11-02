'use client';

import AuthService from '@/services/Auth.service';

import { AuthRes, LoginReq, SignUpReq } from '@/types/auth';
import type { User } from '@/types/user';
import { AxiosResponse } from 'axios';

function generateToken(): string {
  const arr = new Uint8Array(12);
  window.crypto.getRandomValues(arr);
  return Array.from(arr, (v) => v.toString(16).padStart(2, '0')).join('');
}

const user = {
  id: 'USR-000',
  avatar: '/assets/avatar.png',
  firstName: 'Sofia',
  lastName: 'Rivers',
  email: 'sofia@devias.io',
} satisfies User;

export interface SignInWithOAuthParams {
  provider: 'google' | 'discord';
}

export interface SignInWithPasswordParams {
  email: string;
  password: string;
}

export interface ResetPasswordParams {
  email: string;
}

class AuthClient {
  async signUp(data: SignUpReq): Promise<AuthRes> {
    const res = await AuthService.register(data);
    return res.data;
  }

  async signInWithOAuth(_: SignInWithOAuthParams): Promise<{ error?: string }> {
    return { error: 'Social authentication not implemented' };
  }

  async signInWithPassword(data: LoginReq): Promise<AuthRes> {
    const res = await AuthService.login(data);
    localStorage.setItem('accessToken', res.data.access_token);
    return res.data;
  }

  async resetPassword(_: ResetPasswordParams): Promise<{ error?: string }> {
    return { error: 'Password reset not implemented' };
  }

  async updatePassword(_: ResetPasswordParams): Promise<{ error?: string }> {
    return { error: 'Update reset not implemented' };
  }

  async getUser(): Promise<{ data?: User | null; error?: string }> {
    // Make API request

    // We do not handle the API, so just check if we have a token in localStorage.
    const token = localStorage.getItem('accessToken');

    if (!token) {
      return { data: null };
    }

    return { data: user };
  }

  async signOut(): Promise<{ error?: string }> {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    return {};
  }

  // New method to verify OTP
  async verifyOtp(email: string, otp: string): Promise<AuthRes> {
    try {
      const res: AxiosResponse<AuthRes> = await AuthService.verify({ email, otp });
      localStorage.setItem('accessToken', res.data.access_token);
      // Optionally handle any specific logic after verification
      return res.data;
    } catch (error) {
      throw error;
    }
  }

  // New method to resend OTP
  async resendOtp(email: string): Promise<{ error?: string }> {
    try {
      await AuthService.resendOtp(email);
      return { error: undefined };
    } catch (error) {
      return { error: error.response?.data?.message || 'Resend OTP failed' };
    }
  }
}

export const authClient = new AuthClient();
