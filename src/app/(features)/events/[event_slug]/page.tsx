import type { Metadata } from 'next';
import { AxiosResponse } from 'axios';
import { cache } from 'react'; // 1. Import cache từ react
import EventDetail from './event-detail';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import { EventResponse } from '@/components/transactions/create-steps/types';

export const dynamic = 'force-dynamic';

type EventMeta = {
    name: string;
    description: string | null;
    bannerUrl: string | null;
    avatarUrl: string | null;
    slug: string;
};

// 2. Bọc hàm fetch bằng cache()
const fetchEvent = cache(async (eventSlug: string) => {
    try {
        const response: AxiosResponse<EventResponse> = await baseHttpServiceInstance.get(
            `/marketplace/events/${eventSlug}`
        );
        return response.data;
    } catch (_err) {
        return null;
    }
});

export async function generateMetadata(
    { params, searchParams }: { params: { event_slug: string }; searchParams: { lang?: string } }
): Promise<Metadata> {
    // Lần gọi đầu tiên: cache() sẽ thực thi axios và lưu kết quả vào bộ nhớ tạm của server
    const event = await fetchEvent(params.event_slug) as EventMeta;

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
            type: 'article',
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

export default async function EventPage({ params }: { params: { event_slug: string } }) {
    // Lần gọi thứ hai: cache() phát hiện params.event_slug giống hệt lần 1
    // Nó sẽ trả về kết quả ngay lập tức mà KHÔNG gọi axios thêm lần nào nữa!
    const event = await fetchEvent(params.event_slug);

    return <EventDetail params={params} initialEvent={event} />;
}