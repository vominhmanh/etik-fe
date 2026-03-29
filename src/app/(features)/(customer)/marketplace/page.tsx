import type { Metadata } from 'next';
import { cache } from 'react';
import { AxiosResponse } from 'axios';
import Marketplace, { EventResponse } from './marketplace';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';

export const dynamic = 'force-dynamic';

const fetchEvents = cache(async () => {
    try {
        const response: AxiosResponse<EventResponse[]> = await baseHttpServiceInstance.get(
            '/marketplace/events'
        );
        return response.data;
    } catch (_err) {
        return [];
    }
});

export async function generateMetadata(
    { searchParams }: { searchParams: { lang?: string } }
): Promise<Metadata> {
    const isEn = (searchParams?.lang === 'en');
    const siteSlogan = isEn ? 'E-tickets & Event Management' : 'Vé điện tử & Quản lý sự kiện';
    const titlePrefix = isEn ? 'Hot Events' : 'Sự kiện HOT';
    
    const title = `${titlePrefix} | ETIK - ${siteSlogan}`;
    const description = isEn 
        ? `ETIK - ${siteSlogan} | Explore hot events on ETIK` 
        : `ETIK - ${siteSlogan} | Khám phá các sự kiện hot trên ETIK`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
        },
    };
}

export default async function MarketplacePage() {
    const events = await fetchEvents();
    return <Marketplace initialEvents={events} />;
}
