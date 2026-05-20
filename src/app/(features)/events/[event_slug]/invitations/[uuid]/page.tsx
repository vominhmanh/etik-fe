import type { Metadata } from 'next';
import { AxiosResponse } from 'axios';
import { cache } from 'react';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import { EventResponse } from '@/components/transactions/create-steps/types';
import InvitationCheckout from './invitation-checkout';
import { notFound } from 'next/navigation';

export const revalidate = 0; // Don't cache invitation pages as status can change

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

const fetchInvitation = cache(async (uuid: string) => {
    try {
        const response: AxiosResponse<any> = await baseHttpServiceInstance.get(
            `/marketplace/invitations/${uuid}`
        );
        return response.data;
    } catch (_err) {
        return null;
    }
});

export async function generateMetadata(
    { params }: { params: { event_slug: string, uuid: string } }
): Promise<Metadata> {
    const event = await fetchEvent(params.event_slug);
    const title = event?.name ? `Lời mời mua vé - ${event.name} | ETIK` : 'Lời mời mua vé | ETIK';

    return {
        title,
        description: 'Bạn nhận được lời mời mua vé tham dự sự kiện từ ETIK',
        robots: 'noindex, nofollow' // Don't index invitation links
    };
}

export default async function InvitationPage({ params }: { params: { event_slug: string, uuid: string } }) {
    const [event, invitation] = await Promise.all([
        fetchEvent(params.event_slug),
        fetchInvitation(params.uuid)
    ]);

    if (!event || !invitation) {
        return notFound();
    }

    return <InvitationCheckout params={params} initialEvent={event} invitation={invitation} />;
}
