'use client'

import React from 'react';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import axios, { AxiosResponse } from 'axios';
import NotificationContext from '@/contexts/notification-context';
import dayjs from 'dayjs';

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

export default function Page(): React.JSX.Element {
  const params = { event_slug: 'tft-hon-chien-d2' };
  const notificationCtx = React.useContext(NotificationContext);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [leaderboardData, setLeaderboardData] = React.useState<Leaderboard | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = React.useState<number>(0);
  const [counter, setCounter] = React.useState<number>(10);

  // Compute pages of 16 entries each
  const pages = React.useMemo(() => {
    if (!leaderboardData?.data) return [];
    const chunks: LeaderboardEntry[][] = [];
    for (let i = 0; i < leaderboardData.data.length; i += 16) {
      chunks.push(leaderboardData.data.slice(i, i + 16));
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
    setCurrentPage(p => (p + 1) % pages.length);
    setCounter(10);
  }, [counter, pages.length]);

  // Fetch function
  const fetchLeaderboard = async () => {
    if (!params.event_slug) return;
    try {
      setIsLoading(true);
      const response: AxiosResponse<Leaderboard> = await baseHttpServiceInstance.get(
        `/special_events/tft-2025/leaderboards/GroupB Day 2 - Leaderboard`
      );
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
  }, [params.event_slug]);

  // Poll every 30s to refresh data
  React.useEffect(() => {
    const pollId = setInterval(() => {
      fetchLeaderboard();
    }, 30000);
    return () => clearInterval(pollId);
  }, [params.event_slug]);

  const displayData = pages[currentPage] || [];

  return (
    <div
      style={{
        position: 'relative',
        scrollBehavior: 'smooth',
        backgroundColor: '#d1f9db',
        backgroundImage: `linear-gradient(356deg, #d1f9db 0%, #fffed9 100%)`,
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <img
        src={'/assets/BANG-XEP-HANG-B-2-TRAN.jpg'}
        alt="Event Image"
        style={{
          width: 'auto',
          height: '100%',
          display: 'block',
          objectFit: 'contain',
          objectPosition: 'top',
          borderRadius: '15px',
        }}
      />

      {/* Counter display */}
      <div
        style={{
          position: 'absolute',
          top: '2%',
          right: '2%',
          fontSize: '2vh',
          fontWeight: 'bold',
          color: '#ffe559',
        }}
      >
        {counter}
      </div>

      <div
        className="leaderboard-overlay"
        style={{ position: 'absolute', top: '18.25%', height: '79%', width: '171vh', color: '#ffe559' }}
      >
        <div
          style={{
            position: 'absolute',
            top: '101%',
            left: '0%',
            fontSize: '1vh',
            fontWeight: 'bold',
            color: '#ffe559',
            fontStyle: 'italic',
          }}
        >
          Cập nhật lần cuối lúc: {dayjs(leaderboardData?.updated || 0).format('HH:mm DD/MM/YYYY')}
        </div>
        {displayData.map((entry, index) => (
          <div
            key={`${currentPage}-${index}`}
            className="leaderboard-item"
            style={{
              position: 'absolute',
              top: `${index * (100 / 16) + 0.4}%`,
              left: 0,
              width: '100%',
              height: `${100 / 16}%`,
              display: 'flex',
              alignItems: 'center',
              boxSizing: 'border-box',
              fontSize: '2.5vh',
              fontStyle: 'italic',
            }}
          >
            <span style={{ fontWeight: 'bold', position: 'absolute', width: '8vh', left: '0', textAlign: 'center' }}>
              {entry.position}
            </span>
            <span style={{ fontWeight: 'bold', position: 'absolute', width: '8vh', left: '8vh', textAlign: 'center' }}>
              {entry.sbd}
            </span>
            <span style={{ fontWeight: 'bold', position: 'absolute', width: '29vh', left: '16vh', textAlign: 'center' }}>
              {entry.name}
            </span>
            {entry.scores.map((score, idx) => (
              <span
                key={idx}
                style={{
                  fontWeight: 'bold',
                  position: 'absolute',
                  width: '42.20vh',
                  left: `${45 + 42.20 * idx}vh`,
                  textAlign: 'center',
                }}
              >
                {score}
              </span>
            ))}
            <span
              style={{
                fontWeight: 'bold',
                position: 'absolute',
                width: '42.20vh',
                left: `129.4vh`,
                textAlign: 'center',
              }}
            >
              {entry.total}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
