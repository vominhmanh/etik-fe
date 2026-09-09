'use client';

import React from 'react';
import TFTLeaderboardView, { Leaderboard, LeaderboardEntry } from '@/components/events/tft-leaderboard/tft-leaderboard-view';

export type { Leaderboard, LeaderboardEntry };

export default function Page(): React.JSX.Element {
  return (
    <TFTLeaderboardView
      eventSlug="tft-2026-solo-final"
      apiEndpoint="/special_events/tft-2026/leaderboards/Finals-SOLO - Leaderboard"
      bgImage="https://media.etik.vn/tft-2026/BANG_XEP_HANG_CA_NHAN.png"
    />
  );
}
