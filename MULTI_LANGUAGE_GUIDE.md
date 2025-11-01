# Multi-Language Implementation Guide

## Overview

This application now supports Vietnamese (default) and English languages using URL-based locale detection with inline translations.

## URL Structure

- **Vietnamese (default)**: `https://etik.vn/events/my-event`
- **English**: `https://etik.vn/en/events/my-event`

## How It Works

1. **Middleware** (`src/middleware.ts`) rewrites `/en/*` URLs internally while preserving the browser URL
2. **LocaleProvider** (`src/contexts/locale-context.tsx`) detects locale from the URL
3. **Components** use the `tt()` function for inline translations

## Usage in Components

### Import the hook

```typescript
import { useTranslation } from '@/contexts/locale-context';
```

### Use the translation function

```typescript
export default function MyComponent() {
  const { tt, locale } = useTranslation();

  return (
    <div>
      <h1>{tt('Tiêu đề', 'Title')}</h1>
      <p>{tt('Nội dung tiếng Việt', 'English content')}</p>
      <Button>{tt('Đăng ký', 'Register')}</Button>
    </div>
  );
}
```

### Translation Function Signature

```typescript
tt(vietnameseText: string, englishText: string): string
```

## Language Switcher

The `LanguageSwitcher` component is already integrated in:
- `/src/app/(features)/events/main-nav.tsx`

You can add it to other navigation components:

```typescript
import { LanguageSwitcher } from '@/components/language-switcher';

// In your component
<LanguageSwitcher />
```

## Complete Example

```typescript
'use client';

import { useTranslation } from '@/contexts/locale-context';
import { Button, Typography, Card, CardContent } from '@mui/material';

export default function EventRegistration() {
  const { tt, locale } = useTranslation();

  return (
    <Card>
      <CardContent>
        <Typography variant="h5">
          {tt('Đăng ký sự kiện', 'Event Registration')}
        </Typography>
        
        <Typography variant="body1">
          {tt(
            'Vui lòng điền đầy đủ thông tin dưới đây',
            'Please fill in all information below'
          )}
        </Typography>

        <Button variant="contained">
          {tt('Đăng ký ngay', 'Register now')}
        </Button>

        {/* You can also use the locale directly */}
        {locale === 'en' && (
          <Typography>Additional English-only content</Typography>
        )}
      </CardContent>
    </Card>
  );
}
```

## Best Practices

1. **Keep translations inline** - No JSON files needed
2. **Always provide both languages** - Vietnamese first, then English
3. **Use meaningful text** - Don't use placeholder keys like 'button.submit'
4. **Be consistent** - Use the same translation for the same concept
5. **Test both URLs** - Visit both `/path` and `/en/path` to verify

## Switching Languages Programmatically

```typescript
import { useRouter, usePathname } from 'next/navigation';

export function MyComponent() {
  const router = useRouter();
  const pathname = usePathname();

  const switchToEnglish = () => {
    if (!pathname.startsWith('/en')) {
      router.push(`/en${pathname}`);
    }
  };

  const switchToVietnamese = () => {
    if (pathname.startsWith('/en')) {
      router.push(pathname.substring(3) || '/');
    }
  };

  return (
    <div>
      <button onClick={switchToEnglish}>English</button>
      <button onClick={switchToVietnamese}>Tiếng Việt</button>
    </div>
  );
}
```

## Files Structure

```
src/
├── middleware.ts                    # URL rewriting for /en paths
├── contexts/
│   └── locale-context.tsx          # Locale provider and useTranslation hook
├── components/
│   └── language-switcher.tsx       # Language switcher UI component
└── app/
    └── layout.tsx                  # Root layout with LocaleProvider
```

## Testing

1. **Visit Vietnamese version**: `http://localhost:3000/events/my-event`
   - Should display Vietnamese text
   
2. **Visit English version**: `http://localhost:3000/en/events/my-event`
   - Should display English text
   
3. **Use language switcher**: Click VI/EN buttons
   - Should navigate between locale URLs
   
4. **Share URLs**: Send `/en/path` to English users
   - They should see English content

## Migration Guide

If you have existing components with hardcoded Vietnamese text:

**Before:**
```typescript
<Button>Đăng ký</Button>
```

**After:**
```typescript
const { tt } = useTranslation();
<Button>{tt('Đăng ký', 'Register')}</Button>
```

## SEO Benefits

- ✅ Different URLs for different languages
- ✅ Shareable locale-specific links
- ✅ Search engines can index both versions
- ✅ Users can bookmark their preferred language

## Notes

- Default locale is Vietnamese (`vi`)
- English URLs are prefixed with `/en`
- The middleware handles URL rewriting transparently
- No folder duplication needed in the app directory
- The same components serve both languages

