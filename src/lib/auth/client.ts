'use client';

import AuthService from '@/services/Auth.service';

import { AuthRes, LoginReq, SignUpReq, User } from '@/types/auth';
import { AxiosResponse } from 'axios';

function generateToken(): string {
  const arr = new Uint8Array(12);
  window.crypto.getRandomValues(arr);
  return Array.from(arr, (v) => v.toString(16).padStart(2, '0')).join('');
}


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

  async signInWithOAuthPopup({ provider }: SignInWithOAuthParams): Promise<User> {
    return new Promise<User>((resolve, reject) => {
      const width = 500;
      const height = 600;
      const left = Math.max(0, Math.floor(window.screenX + (window.outerWidth - width) / 2));
      const top = Math.max(0, Math.floor(window.screenY + (window.outerHeight - height) / 2));
      const features = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`;
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/login/${provider}/popup`;

      const popup = window.open(url, 'oauth_popup', features);
      if (!popup) {
        reject(new Error('Không thể mở popup đăng nhập. Vui lòng tắt chặn popup và thử lại.'));
        return;
      }

      const startTs = Date.now();
      const timeoutMs = 2 * 60 * 1000; // 2 minutes
      const pollIntervalMs = 1000;

      const cleanup = (): void => {
        window.clearInterval(intervalId);
        window.removeEventListener('message', onMessage as any);
      };

      const checkUser = async (): Promise<boolean> => {
        try {
          const { data } = await this.getUser();
          if (data && (data as User).email) {
            return true;
          }
        } catch (_e) {
          // ignore and continue polling
        }
        return false;
      };

      const onMessage = async (event: MessageEvent): Promise<void> => {
        try {
          const data = (event && (event as any).data) || {};
          if (data && data.type === 'etik:google-login' && data.success) {
            // Single attempt: /me (will auto-refresh on 401 once via HTTP service)
            const { data: user, error } = await this.getUser();
            cleanup();
            try { popup.close(); } catch {}
            if (user && (user as User).email) {
              resolve(user as User);
            } else {
              reject(new Error(error || 'Đăng nhập thành công nhưng chưa lấy được phiên. Vui lòng thử lại.'));
            }
          }
        } catch (_e) {
          // ignore
        }
      };

      window.addEventListener('message', onMessage as any);

      const intervalId = window.setInterval(async () => {
        if (Date.now() - startTs > timeoutMs) {
          cleanup();
          try { popup.close(); } catch {}
          reject(new Error('Hết thời gian đăng nhập Google. Vui lòng thử lại.'));
          return;
        }

        if (popup.closed) {
          cleanup();
          reject(new Error('Cửa sổ đăng nhập đã đóng trước khi hoàn tất.'));
          return;
        }
      }, pollIntervalMs);
    });
  }

  async signInWithPassword(data: LoginReq): Promise<AuthRes> {
    const res = await AuthService.login(data);
    return res.data;
  }

  async updatePassword(_: ResetPasswordParams): Promise<{ error?: string }> {
    return { error: 'Update reset not implemented' };
  }

  async getUser(): Promise<{ data?: User | null; error?: string }> {
    try {
      const me = await AuthService.me();
      if (!me) {
        return { data: null };
      }
      const meUser = (me?.user ?? me) as User;
      // Persist user for guards that read from localStorage
      localStorage.setItem('user', JSON.stringify(meUser));
      return { data: meUser };
    } catch (error: any) {
      return { error: error?.message || 'Failed to fetch user' };
    }
  }

  async signOut(): Promise<{ error?: string }> {
    await AuthService.logout();
    localStorage.removeItem('user');
    return {};
  }

  // New method to verify OTP
  async verifyOtp(email: string, otp: string): Promise<AuthRes> {
    try {
      const res: AxiosResponse<AuthRes> = await AuthService.verify({ email, otp });
      // Cookie set by server; no token stored client-side
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
    } catch (error: any) {
      return { error: error.response?.data?.message || 'Resend OTP failed' };
    }
  }

}


export const authClient = new AuthClient();

