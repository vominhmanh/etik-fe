'use client';

import * as React from 'react';

import { User } from '@/types/auth';
import { authClient } from '@/lib/auth/client';

export interface UserContextValue {
  user: User | null;
  checkSession: () => Promise<User | null>;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
}

export const UserContext = React.createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const checkSession = React.useCallback(async (): Promise<User | null> => {
    setIsLoading(true);
    try {
      const { data, error: authError } = await authClient.getUser();

      // Trường hợp 1: Có thông tin user -> Người dùng đã đăng nhập thành công
      if (data) {
        const normalized: User = (data as any).fullName !== undefined
          ? (data as unknown as User)
          : {
              fullName: (data as any).fullName ?? (data as any).name ?? '',
              email: (data as any).email ?? '',
              phoneNumber: (data as any).phoneNumber ?? '',
            };
        setUser(normalized);
        setError(null);
        return normalized;
      }

      // Trường hợp 2: Có lỗi thực sự từ hệ thống/network (500, lỗi kết nối...)
      if (authError) {
        setError(authError);
        setUser(null);
        return null;
      }

      // Trường hợp 3: Khách vãng lai (chưa đăng nhập / phiên hết hạn bình thường)
      // KHÔNG gán error ở đây!
      setUser(null);
      setError(null);
      return null;
    } catch (err: any) {
      setError(err?.message || 'Something went wrong');
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    checkSession().catch(() => {});
  }, [checkSession]);

  return (
    <UserContext.Provider value={{ user, checkSession, isLoading, error, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

