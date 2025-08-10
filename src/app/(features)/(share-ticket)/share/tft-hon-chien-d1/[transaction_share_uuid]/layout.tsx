import type { Metadata } from 'next';
import type { ReactElement, ReactNode } from 'react';

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
  ticketQuantity: number;
}

const EVENT_SLUG = 'tft-hon-chien-d1';

async function fetchShareData(transactionShareUuid: string): Promise<{ event: EventResponse | null; transaction: TransactionResponse | null; }>
{
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) return { event: null, transaction: null };
  try {
    const res = await fetch(`${baseUrl}/customers/share-transactions/${EVENT_SLUG}/${transactionShareUuid}`, {
      cache: 'no-store',
    });
    if (!res.ok) return { event: null, transaction: null };
    const raw = (await res.json()) as unknown;
    const data = raw as { event: EventResponse; transaction: TransactionResponse };
    return { event: data.event, transaction: data.transaction };
  } catch {
    return { event: null, transaction: null };
  }
}

export async function generateMetadata(
  { params }: { params: { transaction_share_uuid: string } }
): Promise<Metadata> {
  const { event, transaction } = await fetchShareData(params.transaction_share_uuid);

  const title = transaction && event
    ? `${transaction.name} đã sở hữu vé của sự kiện ${event.name}`
    : event?.name ?? 'ETIK';

  const description = event?.description ? event.description.replace(/<[^>]+>/g, '') : undefined;
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


