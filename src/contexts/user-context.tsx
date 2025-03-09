'use client';

import * as React from 'react';

import { User } from '@/types/auth';
import { authClient } from '@/lib/auth/client';
import { logger } from '@/lib/default-logger';

export interface UserContextValue {
  error: string | null;
  isLoading: boolean;
  checkSession?: () => Promise<void>;
  setUser: (user: User | null) => void;
  getUser: () => User | null;
}

export const UserContext = React.createContext<UserContextValue | undefined>(undefined);

export interface UserProviderProps {
  children: React.ReactNode;
}

export function UserProvider({ children }: UserProviderProps): React.JSX.Element {
  const [state, setState] = React.useState<{ error: string | null; isLoading: boolean }>({
    error: null,
    isLoading: true,
  });

  const checkSession = React.useCallback(async (): Promise<void> => {
    try {
      const { data, error } = await authClient.getUser();

      if (error) {
        logger.error(error);
        setState((prev) => ({ ...prev, error: 'Something went wrong', isLoading: false }));
        return;
      }

      setState((prev) => ({ ...prev, error: null, isLoading: false }));
    } catch (err) {
      logger.error(err);
      setState((prev) => ({ ...prev, error: 'Something went wrong', isLoading: false }));
    }
  }, []);

  const setUser = React.useCallback((user: User | null): void => {
    localStorage.setItem('user', JSON.stringify(user));
  }, []);

  const getUser = React.useCallback((): User | null => {
    const user = localStorage.getItem('user');

    if (!user) {
      return null;
    }

    return JSON.parse(user) as User;
  }, []);

  React.useEffect(() => {
    checkSession().catch((err: unknown) => {
      logger.error(err);
      // noop
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Expected
  }, []);

  return <UserContext.Provider value={{ ...state, checkSession, setUser, getUser }}>{children}</UserContext.Provider>;
}

export const UserConsumer = UserContext.Consumer;
