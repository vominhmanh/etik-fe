import type { ReactElement, ReactNode } from 'react';

export const dynamic = 'force-dynamic';

export default function EventLayout({ children }: { children: ReactNode }): ReactElement {
  return children as ReactElement;
}
