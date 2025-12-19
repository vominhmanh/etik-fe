'use client';

import * as React from 'react';

import { User } from '@/types/auth';
import { authClient } from '@/lib/auth/client';

export interface UserContextValue {
  user: User | null;
  checkSession: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
}

export const UserContext = React.createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const checkSession = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await authClient.getUser(); // gọi /auth/me (credentials: 'include')
      if (error) {
        setError('Something went wrong');
        setUser(null);
      } else {
        setError(null);
        const normalized: User | null = data && (data as any).fullName !== undefined
          ? (data as unknown as User)
          : data
            ? {
              fullName: (data as any).fullName ?? (data as any).name ?? '',
              email: (data as any).email ?? '',
              phoneNumber: (data as any).phoneNumber ?? '',
            }
            : null;
        setUser(normalized);
      }
    } catch (err) {
      setError('Something went wrong');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    checkSession().catch(() => { });
  }, [checkSession]);

  return (
    <UserContext.Provider value={{ user, checkSession, isLoading, error, setUser }}>
      {children}
    </UserContext.Provider>
  );
}
