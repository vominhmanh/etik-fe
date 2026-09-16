import type { Metadata } from 'next';
import { AxiosResponse } from 'axios';
import { cache } from 'react'; // 1. Import cache từ react
import EventDetail from './event-detail';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import { EventResponse } from '@/components/transactions/create-steps/types';

export const revalidate = 60; // revalidate every 60 seconds

type EventMeta = {
    name: string;
    description: string | null;
    bannerUrl: string | null;
    avatarUrl: string | null;
    slug: string;
};

// 2. Bọc hàm fetch bằng cache()
// QUAN TRỌNG: không được nuốt lỗi thành `null` ở đây. Trang này dùng ISR
// (`revalidate = 60`) - nếu fetch lỗi/timeout trong lúc Next.js revalidate
// nền mà hàm này trả về `null` thay vì throw, Next.js sẽ hiểu là "regenerate
// thành công với dữ liệu null" và LƯU LUÔN bản null đó vào cache cho mọi
// người xem trong 60 giây tiếp theo. Để hàm throw ra ngoài thì Next.js sẽ
// giữ nguyên bản cache tốt gần nhất (stale-while-error) và tự thử lại ở lần
// revalidate kế tiếp, thay vì phát tán một trang toàn giá trị null.
const fetchEvent = cache(async (eventSlug: string) => {
    const response: AxiosResponse<EventResponse> = await baseHttpServiceInstance.get(
        `/marketplace/events/${eventSlug}`
    );
    return response.data;
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