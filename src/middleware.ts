import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['en', 'vi'];
const defaultLocale = 'vi';

// Paths that should not be rewritten
const excludedPaths = [
  '/_next',
  '/api',
  '/favicon.ico',
  '/assets',
  '/static',
  '/fonts',
  '/model_tfjs',
  '/robots.txt',
  '/sitemap',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for excluded paths
  if (excludedPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  console.log('pathname', pathname);
  console.log('pathname starts with /en', pathname.startsWith('/en'));
  // Check if pathname starts with /en
  if (pathname.startsWith('/en')) {
    // Extract the path without /en prefix
    const pathWithoutLocale = pathname.replace(/^\/en/, '') || '/';
    console.log('pathWithoutLocale', pathWithoutLocale);
    // Create a new URL with the path stripped of /en
    const url = request.nextUrl.clone();
    url.pathname = pathWithoutLocale;
      console.log('url', url);
    // Rewrite to the path without /en, but keep /en in the browser URL
    const response = NextResponse.rewrite(url);
    
    // Set headers/cookies so components know the locale
    response.headers.set('x-locale', 'en');
    response.cookies.set('NEXT_LOCALE', 'en');
    
    return response;
  }

  // For non-/en paths, set default locale
  const response = NextResponse.next();
  response.headers.set('x-locale', defaultLocale);
  response.cookies.set('NEXT_LOCALE', defaultLocale);
  
  return response;
}

export const config = {
  matcher: [
    // Match all paths except the excluded ones
    '/((?!_next|api|favicon.ico|assets|static|fonts|model_tfjs|robots.txt|sitemap).*)',
  ],
};

