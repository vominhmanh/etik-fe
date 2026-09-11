'use client';

import React from 'react';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import { AxiosResponse } from 'axios';
import NotificationContext from '@/contexts/notification-context';
import dayjs from 'dayjs';
import './fonts.css';

export interface LeaderboardEntry {
  position?: number;
  sbd?: string;
  name: string;
  scores?: number[];
  total: number;
}

export interface Leaderboard {
  updated: Date | null;
  data: LeaderboardEntry[];
}

export interface TFTDuoFinalViewProps {
  eventSlug?: string;
  apiEndpoint?: string;
  bgImage?: string;
}

const DEFAULT_BG = 'https://media.etik.vn/tft-2026/CHUNG_KET_DUO.png';

// Tọa độ % chính xác tuyệt đối trên khung 16:9 (1920x1080)
const ROW_TOPS = ['47.59%', '57.69%', '67.78%', '77.87%'];
const ROW_HEIGHT = '8.33%';

export default function TFTDuoFinalView({
  eventSlug = 'tft-2026-duo-final',
  apiEndpoint = '/special_events/tft-2026/leaderboards/DUO - Final Leaderboard',
  bgImage = DEFAULT_BG,
}: TFTDuoFinalViewProps): React.JSX.Element {
  const notificationCtx = React.useContext(NotificationContext);
  const [leaderboardData, setLeaderboardData] = React.useState<Leaderboard | null>(null);

  // Fetch function
  const fetchLeaderboard = async () => {
    if (!apiEndpoint) return;
    try {
      const response: AxiosResponse<Leaderboard> = await baseHttpServiceInstance.get(apiEndpoint);
      if (response.data) {
        setLeaderboardData(response.data);
      }
    } catch (error) {
      // Giữ im lặng khi polling gặp lỗi để không làm phiền màn hình chiếu
    }
  };

  // Initial fetch on mount
  React.useEffect(() => {
    fetchLeaderboard();
  }, [apiEndpoint]);

  // Poll every 15s to refresh data
  React.useEffect(() => {
    const pollId = setInterval(() => {
      fetchLeaderboard();
    }, 15000);
    return () => clearInterval(pollId);
  }, [apiEndpoint]);

  // Đảm bảo luôn đủ 4 dòng hiển thị
  const displayRows = React.useMemo(() => {
    const raw = leaderboardData?.data || [];
    const rows: (LeaderboardEntry | null)[] = [];
    for (let i = 0; i < 4; i++) {
      rows.push(raw[i] || null);
    }
    return rows;
  }, [leaderboardData]);

  return (
    <div
      style={{
        position: 'relative',
        scrollBehavior: 'smooth',
        backgroundColor: '#d1f9db',
        backgroundImage: 'linear-gradient(356deg, #d1f9db 0%, #fffed9 100%)',
        height: '100vh',
        width: '100vw',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        fontFamily: "'Normalidad Text Medium', 'GS3 Normalidad Text', sans-serif",
      }}
    >
      {/* 16:9 Letterbox Container */}
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
          alt="Chung Kết Duo Leaderboard"
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            objectFit: 'contain',
            userSelect: 'none',
          }}
        />

        {/* 4 Dòng Bảng Điểm */}
        {displayRows.map((entry, index) => {
          if (!entry) return null;
          return (
            <div
              key={index}
              style={{
                position: 'absolute',
                top: ROW_TOPS[index],
                left: '28.54%',
                width: '46.46%',
                height: ROW_HEIGHT,
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none',
              }}
            >
              {/* TÊN ĐỘI (To vừa vặn, đậm, căn trái thanh lịch) */}
              <div
                style={{
                  width: '78.65%',
                  paddingLeft: '1.5%',
                  paddingRight: '2%',
                  fontSize: '3.4vh',
                  fontWeight: 800,
                  color: '#52426d',
                  WebkitTextStroke: '0.045vh #52426d',
                  fontFamily: "'Normalidad Text Medium', 'GS3 Normalidad Text', sans-serif",
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.1,
                  display: 'flex',
                  alignItems: 'center',
                }}
                title={entry.name}
              >
                {entry.name}
              </div>

              {/* TỔNG ĐIỂM (To vừa vặn, nổi bật, căn giữa ô TỔNG) */}
              <div
                style={{
                  width: '21.35%',
                  textAlign: 'center',
                  fontSize: '4.2vh',
                  fontWeight: 900,
                  color: '#52426d',
                  WebkitTextStroke: '0.06vh #52426d',
                  fontFamily: "'Normalidad Text Medium', 'GS3 Normalidad Text', sans-serif",
                  lineHeight: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {entry.total ?? 0}
              </div>
            </div>
          );
        })}

        {/* Cập nhật lần cuối timestamp */}
        <div
          style={{
            position: 'absolute',
            bottom: '1.2%',
            left: '2%',
            fontSize: '1.4vh',
            fontWeight: 700,
            color: '#52426d',
            fontStyle: 'italic',
            WebkitTextStroke: '0.03vh #52426d',
            fontFamily: "'Normalidad Text Medium', 'GS3 Normalidad Text', sans-serif",
            userSelect: 'none',
          }}
        >
          Cập nhật lần cuối lúc: {dayjs(leaderboardData?.updated || Date.now()).format('HH:mm DD/MM/YYYY')}
        </div>
      </div>
    </div>
  );
}
