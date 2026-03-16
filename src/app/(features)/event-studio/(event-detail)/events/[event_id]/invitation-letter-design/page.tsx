'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Page({ params }: { params: { event_id: number } }): null {
  const router = useRouter();
  useEffect(() => {
    router.replace(`/event-studio/events/${params.event_id}/invitation-letter-designs`);
  }, [params.event_id, router]);
  return null;
}
