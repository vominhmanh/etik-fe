'use client';

import React from 'react';
import TFTDuoFinalView, { Leaderboard, LeaderboardEntry } from '@/components/events/tft-leaderboard/tft-duo-final-view';

export type { Leaderboard, LeaderboardEntry };

export default function Page(): React.JSX.Element {
  return (
    <TFTDuoFinalView
      eventSlug="tft-2026-duo-final"
      apiEndpoint="/special_events/tft-2026/leaderboards/DUO - Final Leaderboard"
      bgImage="https://media.etik.vn/tft-2026/CHUNG_KET_DUO.png"
    />
  );
}
