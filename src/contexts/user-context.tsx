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
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const checkSession = React.useCallback(async (): Promise<User | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await authClient.getUser();
      if (error || !data) {
        setError(error || 'Something went wrong');
        setUser(null);
        return null;
      }
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
    } catch (err) {
      setError('Something went wrong');
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, checkSession, isLoading, error, setUser }}>
      {children}
    </UserContext.Provider>
  );
}
