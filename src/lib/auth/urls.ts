export function buildReturnUrl(pathname: string, search: string): string {
  const current = `${pathname || '/'}${search || ''}`;
  return encodeURIComponent(current);
}

export function getDecodedReturnUrl(raw: string | null | undefined, fallback: string): string {
  if (!raw) return fallback;
  try {
    const decoded = decodeURIComponent(raw);
    return decoded.startsWith('/') ? decoded : fallback;
  } catch {
    return raw.startsWith('/') ? raw : fallback;
  }
}

export function isUnauthorizedError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const message = (error as any)?.message as string | undefined;
  return message === 'Unauthorized' || message === 'Vui lòng đăng nhập lại';
}


