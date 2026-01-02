'use client'

import React, { createContext, useContext } from 'react';
import { SSOConfig } from '@/hooks/use-sso';

export const SSOContext = createContext<SSOConfig | undefined>(undefined);

interface SSOProviderProps {
  children: React.ReactNode;
  config?: SSOConfig;
}

export function SSOProvider({ children, config }: SSOProviderProps) {
  return (
    <SSOContext.Provider value={config}>
      {children}
    </SSOContext.Provider>
  );
}

export function useSSOContext(): SSOConfig | undefined {
  return useContext(SSOContext);
}

