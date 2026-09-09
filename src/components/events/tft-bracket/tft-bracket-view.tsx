'use client';

import React from 'react';
import TFTGroupBracketView, { TFTGroup } from './tft-group-bracket-view';
import TFTKnockoutBracketView from './tft-knockout-bracket-view';

export type BracketStage = 'bang-a' | 'bang-b' | 'bang-c' | 'bang-d' | 'knockout';

interface TFTBracketViewProps {
  stage: BracketStage;
}

export default function TFTBracketView({ stage }: TFTBracketViewProps): React.JSX.Element {
  if (stage === 'knockout') {
    return <TFTKnockoutBracketView />;
  }

  const groupMap: Record<string, TFTGroup> = {
    'bang-a': 'A',
    'bang-b': 'B',
    'bang-c': 'C',
    'bang-d': 'D',
  };

  const group = groupMap[stage] || 'A';
  return <TFTGroupBracketView group={group} />;
}
