import type { ReactElement, ReactNode } from 'react';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

interface EventResponse {
  name: string;
  organizer: string;
  description: string | null;
  bannerUrl: string | null;
  avatarUrl: string | null;
  slug: string;
}

interface TransactionResponse {
  name: string;
  title: string;
  ticketQuantity: number;
}

async function fetchShareData(
  eventSlug: string,
  transactionShareUuid: string
): Promise<{ event: EventResponse | null; transaction: TransactionResponse | null }> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) return { event: null, transaction: null };
  try {
    const res = await fetch(`${baseUrl}/customers/share-transactions/${eventSlug}/${transactionShareUuid}`, {
      // Ensure SSR fetch and revalidate often
      cache: 'no-store',
      // Pass headers only if needed; public endpoint expected
    });
    if (!res.ok) return { event: null, transaction: null };
    const raw = (await res.json()) as unknown;
    const data = raw as { event: EventResponse; transaction: TransactionResponse };
    return { event: data.event, transaction: data.transaction };
  } catch (_err) {
    return { event: null, transaction: null };
  }
}

export async function generateMetadata({
  params,
}: {
  params: { event_slug: string; transaction_share_uuid: string };
}): Promise<Metadata> {
  const { event, transaction } = await fetchShareData(params.event_slug, params.transaction_share_uuid);

  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'vi';
  const isEn = locale === 'en';

  const title =
    transaction && event
      ? isEn
        ? `${transaction.title} ${transaction.name} has purchased tickets for ${event.name}`
        : `${transaction.title} ${transaction.name} đã sở hữu vé của sự kiện ${event.name}`
      : event?.name ?? 'ETIK';

  const siteSlogan = isEn ? 'E-tickets & Event Management' : 'Vé điện tử & Quản lý sự kiện';
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

export default function ShareLayout({ children }: { children: ReactNode }): ReactElement {
  return children as ReactElement;
}
