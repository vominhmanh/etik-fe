'use client';

import React from 'react';
import TFTLeaderboardView, { Leaderboard, LeaderboardEntry } from '@/components/events/tft-leaderboard/tft-leaderboard-view';

export type { Leaderboard, LeaderboardEntry };

export default function Page(): React.JSX.Element {
  return (
    <TFTLeaderboardView
      eventSlug="tft-2026-duo-final"
      apiEndpoint="/special_events/tft-2026/leaderboards/DUO - Final Leaderboard"
      bgImage="https://media.etik.vn/tft-2026/BANG_XEP_HANG_CAP_DOI.png"
    />
  );
}
