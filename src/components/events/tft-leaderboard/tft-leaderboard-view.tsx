'use client';

import React from 'react';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import { AxiosResponse } from 'axios';
import NotificationContext from '@/contexts/notification-context';
import dayjs from 'dayjs';
import './fonts.css';

export interface LeaderboardEntry {
  position: number;
  sbd: string;
  name: string;
  scores: number[];
  total: number;
}

export interface Leaderboard {
  updated: Date | null;
  data: LeaderboardEntry[];
}

export interface TFTLeaderboardViewProps {
  eventSlug: string;
  apiEndpoint: string;
  bgImage: string;
}

export default function TFTLeaderboardView({
  eventSlug,
  apiEndpoint,
  bgImage,
}: TFTLeaderboardViewProps): React.JSX.Element {
  const notificationCtx = React.useContext(NotificationContext);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [leaderboardData, setLeaderboardData] = React.useState<Leaderboard | null>(null);

  // Pagination state: 32 entries per page (16 per column)
  const [currentPage, setCurrentPage] = React.useState<number>(0);
  const [counter, setCounter] = React.useState<number>(10);

  // Compute pages of 32 entries each
  const pages = React.useMemo(() => {
    if (!leaderboardData?.data) return [];
    const chunks: LeaderboardEntry[][] = [];
    for (let i = 0; i < leaderboardData.data.length; i += 32) {
      chunks.push(leaderboardData.data.slice(i, i + 32));
    }
    return chunks;
  }, [leaderboardData]);

  // 1) Tick counter down every second
  React.useEffect(() => {
    if (pages.length === 0) return;
    const id = setInterval(() => {
      setCounter(c => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [pages.length]);

  // 2) When counter hits zero, advance page and reset counter
  React.useEffect(() => {
    if (counter > 0) return;
    setCurrentPage(p => (p + 1) % (pages.length || 1));
    setCounter(10);
  }, [counter, pages.length]);

  // Fetch function
  const fetchLeaderboard = async () => {
    if (!apiEndpoint) return;
    try {
      setIsLoading(true);
      const response: AxiosResponse<Leaderboard> = await baseHttpServiceInstance.get(apiEndpoint);
      setLeaderboardData(response.data);
    } catch (error) {
      notificationCtx.error('Lỗi:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch on mount
  React.useEffect(() => {
    fetchLeaderboard();
  }, [apiEndpoint]);

  // Poll every 30s to refresh data
  React.useEffect(() => {
    const pollId = setInterval(() => {
      fetchLeaderboard();
    }, 30000);
    return () => clearInterval(pollId);
  }, [apiEndpoint]);

  const displayData = pages[currentPage] || [];
  const leftColumnData = displayData.slice(0, 16);
  const rightColumnData = displayData.slice(16, 32);

  const renderColumn = (entries: LeaderboardEntry[], isRight: boolean) => {
    return (
      <div
        style={{
          position: 'absolute',
          top: '19.167%',
          left: isRight ? '51.615%' : '1.875%',
          width: '46.5625%',
          height: '78.426%',
        }}
      >
        {entries.map((entry, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: `${index * (100 / 16)}%`,
              left: 0,
              width: '100%',
              height: `${100 / 16}%`,
              display: 'flex',
              alignItems: 'center',
              boxSizing: 'border-box',
              fontSize: '2.1vh',
              fontWeight: 500,
              color: '#52426d',
              fontFamily: "'Normalidad Text Medium', 'GS3 Normalidad Text', sans-serif",
            }}
          >
            {/* VỊ TRÍ */}
            <div
              style={{
                width: '9.62%',
                textAlign: 'center',
                flexShrink: 0,
                fontWeight: 600,
              }}
            >
              {entry.position ?? (isRight ? index + 17 : index + 1)}
            </div>

            {/* SBD */}
            <div
              style={{
                width: '9.73%',
                textAlign: 'center',
                flexShrink: 0,
                fontWeight: 600,
              }}
            >
              {entry.sbd}
            </div>

            {/* TÊN ĐỘI / TÊN TUYỂN THỦ */}
            <div
              style={{
                width: '69.02%',
                textAlign: 'left',
                paddingLeft: '1.5%',
                paddingRight: '1%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontWeight: 500,
              }}
            >
              {entry.name}
            </div>

            {/* ĐIỂM */}
            <div
              style={{
                width: '11.63%',
                textAlign: 'center',
                flexShrink: 0,
                fontWeight: 600,
              }}
            >
              {entry.total}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      style={{
        position: 'relative',
        scrollBehavior: 'smooth',
        backgroundColor: '#d1f9db',
        backgroundImage: `linear-gradient(356deg, #d1f9db 0%, #fffed9 100%)`,
        height: '100vh',
        width: '100vw',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        fontFamily: "'Normalidad Text Medium', 'GS3 Normalidad Text', sans-serif",
      }}
    >
      <div
        style={{
          position: 'relative',
          height: '100vh',
          aspectRatio: '16 / 9',
          maxWidth: '100vw',
          maxHeight: '100vh',
        }}
      >
        <img
          src={bgImage}
          alt="Event Leaderboard"
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            objectFit: 'contain',
            userSelect: 'none',
          }}
        />

        {/* Counter display */}
        <div
          style={{
            position: 'absolute',
            top: '2%',
            right: '2.5%',
            fontSize: '2.2vh',
            fontWeight: 600,
            color: '#52426d',
            fontFamily: "'Normalidad Text Medium', 'GS3 Normalidad Text', sans-serif",
          }}
        >
          {counter}
        </div>

        {/* 2 columns of 16 entries each (total 32 per page) */}
        {renderColumn(leftColumnData, false)}
        {renderColumn(rightColumnData, true)}

        {/* Last updated timestamp */}
        <div
          style={{
            position: 'absolute',
            bottom: '0.6%',
            left: '2%',
            fontSize: '1.2vh',
            fontWeight: 500,
            color: '#52426d',
            fontStyle: 'italic',
            fontFamily: "'Normalidad Text Medium', 'GS3 Normalidad Text', sans-serif",
          }}
        >
          Cập nhật lần cuối lúc: {dayjs(leaderboardData?.updated || 0).format('HH:mm DD/MM/YYYY')}
        </div>
      </div>
    </div>
  );
}
