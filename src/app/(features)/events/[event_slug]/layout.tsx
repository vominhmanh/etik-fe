import type { Metadata } from 'next';
import type { ReactElement, ReactNode } from 'react';

export const dynamic = 'force-dynamic';

type EventMeta = {
  name: string;
  description: string | null;
  bannerUrl: string | null;
  avatarUrl: string | null;
  slug: string;
};

async function fetchEventMeta(eventSlug: string): Promise<EventMeta | null> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) return null;
  try {
    const res = await fetch(`${baseUrl}/marketplace/events/${eventSlug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = (await res.json()) as unknown as EventMeta;
    return data;
  } catch (_err) {
    return null;
  }
}

export async function generateMetadata(
  { params, searchParams }: { params: { event_slug: string }; searchParams: { lang?: string } }
): Promise<Metadata> {
  const event = await fetchEventMeta(params.event_slug);
  const isEn = (searchParams?.lang === 'en');
  const siteSlogan = isEn ? 'E-tickets & Event Management' : 'Vé điện tử & Quản lý sự kiện';
  const titlePrefix = isEn ? 'Event' : 'Sự kiện';
  const title = event?.name ? `${titlePrefix} ${event.name} | ETIK - ${siteSlogan}` : 'ETIK';
  const description = event?.description
    ? `ETIK - ${siteSlogan} | ${event.description.replace(/<[^>]+>/g, '')}`
    : `ETIK - ${siteSlogan}`;
  const image = event?.bannerUrl || event?.avatarUrl || undefined;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default function EventLayout({ children }: { children: ReactNode }): ReactElement {
  return children as ReactElement;
}


