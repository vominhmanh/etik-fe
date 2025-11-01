'use client';

import { useLocale } from '@/contexts/locale-context';
import { useRouter, usePathname } from 'next/navigation';
import { Button, ButtonGroup } from '@mui/material';

export function LanguageSwitcher() {
  const { locale } = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: 'vi' | 'en') => {
    if (newLocale === locale) return;

    let newPath = pathname;
    
    if (newLocale === 'en') {
      // Switch to English: add /en prefix
      if (!pathname.startsWith('/en')) {
        newPath = `/en${pathname}`;
      }
    } else {
      // Switch to Vietnamese: remove /en prefix
      if (pathname.startsWith('/en')) {
        newPath = pathname.substring(3) || '/';
      }
    }

    router.push(newPath);
  };

  return (
    <ButtonGroup size="small" variant="outlined">
      <Button 
        variant={locale === 'vi' ? 'contained' : 'outlined'}
        onClick={() => switchLocale('vi')}
        sx={{ minWidth: '50px' }}
      >
        VI
      </Button>
      <Button 
        variant={locale === 'en' ? 'contained' : 'outlined'}
        onClick={() => switchLocale('en')}
        sx={{ minWidth: '50px' }}
      >
        EN
      </Button>
    </ButtonGroup>
  );
}

