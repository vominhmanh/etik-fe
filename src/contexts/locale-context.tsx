'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

export type Locale = 'vi' | 'en';

interface LocaleContextValue {
  locale: Locale;
  tt: (vi: string, en: string) => string;
}

const LocaleContext = React.createContext<LocaleContextValue | undefined>(undefined);

export interface LocaleProviderProps {
  children: React.ReactNode;
}

export function LocaleProvider({ children }: LocaleProviderProps): React.JSX.Element {
  const pathname = usePathname(); // Reads browser URL (includes /en if present)
  
  // Detect locale from the browser pathname
  const locale: Locale = pathname.startsWith('/en/') || pathname === '/en' ? 'en' : 'vi';

  // Translation function: returns vi or en string based on locale
  const tt = React.useCallback(
    (vi: string, en: string): string => {
      return locale === 'en' ? en : vi;
    },
    [locale]
  );

  const value = React.useMemo(
    () => ({ locale, tt }),
    [locale, tt]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const context = React.useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}

// Convenience hook for just the translation function
export function useTranslation() {
  const { tt, locale } = useLocale();
  return { tt, locale };
}

