'use client';

import React from 'react';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import dayjs from 'dayjs';
import '@/components/events/tft-leaderboard/fonts.css';

const BG_KNOCKOUT = 'https://media.etik.vn/tft-2026/BRACKET_4V4_KNOCKOUT.png';

function getVal(data: any, ...coords: string[]): string {
  if (!data) return '';
  const cells = data.cells || {};
  for (const c of coords) {
    if (cells[c] && String(cells[c]).trim()) {
      return String(cells[c]).trim();
    }
  }
  if (Array.isArray(data.grid)) {
    for (const c of coords) {
      const match = c.match(/^([A-Z]+)(\d+)$/);
      if (match) {
        const colStr = match[1];
        const row = parseInt(match[2], 10) - 1;
        let col = 0;
        for (let i = 0; i < colStr.length; i++) {
          col = col * 26 + (colStr.charCodeAt(i) - 64);
        }
        col -= 1;
        if (data.grid[row] && data.grid[row][col] && String(data.grid[row][col]).trim()) {
          return String(data.grid[row][col]).trim();
        }
      }
    }
  }
  return '';
}

export default function TFTKnockoutBracketView(): React.JSX.Element {
  const [bracketData, setBracketData] = React.useState<any>(null);
  const [lastUpdated, setLastUpdated] = React.useState<string | null>(null);

  const fetchBracket = async () => {
    try {
      const response = await baseHttpServiceInstance.get(
        '/special_events/tft-2026/leaderboards/4v4 - Brackets'
      );
      if (response.data) {
        setBracketData(response.data.data);
        setLastUpdated(response.data.updated);
      }
    } catch (err) {
      // Keep silent on polling error
    }
  };

  React.useEffect(() => {
    fetchBracket();
    const timer = setInterval(fetchBracket, 15000);
    return () => clearInterval(timer);
  }, []);

  // Helper render text inside box slot - perfectly centered both horizontally and vertically
  const renderSlot = (
    text: string,
    left: string,
    top: string,
    width: string,
    height: string,
    fontSize: string = '1.7vh',
    fontWeight: number = 700
  ) => {
    return (
      <div
        style={{
          position: 'absolute',
          left,
          top,
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '0 0.5vh',
          boxSizing: 'border-box',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          lineHeight: 1.1,
          fontSize,
          fontWeight,
          color: '#52426d',
          WebkitTextStroke: '0.045vh #52426d',
          paintOrder: 'stroke fill',
          fontFamily: "'Normalidad Text Medium', 'GS3 Normalidad Text', sans-serif",
        }}
      >
        {text}
      </div>
    );
  };

  const ko = bracketData?.vongKnockout;
  const k = (structKey: string, ...coords: string[]) => {
    if (structKey && ko && ko[structKey]) {
      return String(ko[structKey]).trim();
    }
    return getVal(bracketData, ...coords);
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
          src={BG_KNOCKOUT}
          alt="Bracket Vòng Knockout"
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            objectFit: 'contain',
            userSelect: 'none',
          }}
        />

        {/* 1/16 LEFT (left: 6.88%, width: 9.22%, height: 2.78%) */}
        {renderSlot(k('v1_16_m1_t1', 'B46', 'C46'), '6.88%', '42.78%', '9.22%', '2.78%', '1.65vh')}
        {renderSlot(k('v1_16_m1_t2', 'B47', 'C47'), '6.88%', '45.65%', '9.22%', '2.78%', '1.65vh')}
        {renderSlot(k('v1_16_m2_t1', 'B50', 'C50'), '6.88%', '52.59%', '9.22%', '2.78%', '1.65vh')}
        {renderSlot(k('v1_16_m2_t2', 'B51', 'C51'), '6.88%', '55.46%', '9.22%', '2.78%', '1.65vh')}
        {renderSlot(k('v1_16_m3_t1', 'B55', 'C55'), '6.88%', '62.59%', '9.22%', '2.78%', '1.65vh')}
        {renderSlot(k('v1_16_m3_t2', 'B56', 'C56'), '6.88%', '65.46%', '9.22%', '2.78%', '1.65vh')}
        {renderSlot(k('v1_16_m4_t1', 'B59', 'C59'), '6.88%', '72.22%', '9.22%', '2.87%', '1.65vh')}
        {renderSlot(k('v1_16_m4_t2', 'B60', 'C60'), '6.88%', '75.19%', '9.22%', '2.78%', '1.65vh')}

        {/* TỨ KẾT LEFT (left: 18.07%, width: 9.53%, height: 5.65%) */}
        {renderSlot(k('tuKet_m1', 'D46', 'E46', 'D47', 'E47'), '18.07%', '42.78%', '9.53%', '5.65%', '1.95vh')}
        {renderSlot(k('tuKet_m2', 'D50', 'E50', 'D51', 'E51'), '18.07%', '52.59%', '9.53%', '5.65%', '1.95vh')}
        {renderSlot(k('tuKet_m3', 'D55', 'E55', 'D56', 'E56'), '18.07%', '62.59%', '9.53%', '5.65%', '1.95vh')}
        {renderSlot(k('tuKet_m4', 'D58', 'E58', 'D59', 'E59'), '18.07%', '72.13%', '9.53%', '5.65%', '1.95vh')}

        {/* BÁN KẾT LEFT (left: 31.04%, width: 9.53%) */}
        {renderSlot(k('banKet_m1', 'G48', 'H48', 'G49', 'H49'), '31.04%', '47.69%', '9.53%', '6.39%', '2.05vh')}
        {renderSlot(k('banKet_m2', 'G56', 'H56', 'G57', 'H57'), '31.04%', '67.41%', '9.53%', '5.65%', '2.05vh')}

        {/* CHUNG KẾT LEFT (left: 39.22%, width: 9.74%, height: 5.65%) */}
        {renderSlot(k('chungKet_left', 'I52', 'J52', 'I53', 'J53'), '39.22%', '57.13%', '9.74%', '5.65%', '2.15vh', 800)}

        {/* CHUNG KẾT RIGHT (left: 50.52%, width: 9.79%, height: 5.65%) */}
        {renderSlot(k('chungKet_right', 'L52', 'M52', 'L53', 'M53'), '50.52%', '57.13%', '9.79%', '5.65%', '2.15vh', 800)}

        {/* BÁN KẾT RIGHT (left: 59.48%, width: 9.53%) */}
        {renderSlot(k('banKet_m3', 'O48', 'P48', 'O49', 'P49'), '59.48%', '47.69%', '9.53%', '6.39%', '2.05vh')}
        {renderSlot(k('banKet_m4', 'O56', 'P56', 'O57', 'P57'), '59.48%', '67.41%', '9.53%', '5.65%', '2.05vh')}

        {/* TỨ KẾT RIGHT (left: 72.45%, width: 9.53%, height: 5.65%) */}
        {renderSlot(k('tuKet_m5', 'R46', 'S46', 'R47', 'S47'), '72.45%', '42.78%', '9.53%', '5.65%', '1.95vh')}
        {renderSlot(k('tuKet_m6', 'R50', 'S50', 'R51', 'S51'), '72.45%', '52.59%', '9.53%', '5.65%', '1.95vh')}
        {renderSlot(k('tuKet_m7', 'R55', 'S55', 'R56', 'S56'), '72.45%', '62.59%', '9.53%', '5.65%', '1.95vh')}
        {renderSlot(k('tuKet_m8', 'R58', 'S58', 'R59', 'S59'), '72.45%', '72.13%', '9.53%', '5.65%', '1.95vh')}

        {/* 1/16 RIGHT (left: 83.96%, width: 9.22%, height: 2.78%) */}
        {renderSlot(k('v1_16_m5_t1', 'T46', 'U46'), '83.96%', '42.78%', '9.22%', '2.78%', '1.65vh')}
        {renderSlot(k('v1_16_m5_t2', 'T47', 'U47'), '83.96%', '45.65%', '9.22%', '2.78%', '1.65vh')}
        {renderSlot(k('v1_16_m6_t1', 'T50', 'U50'), '83.96%', '52.59%', '9.22%', '2.78%', '1.65vh')}
        {renderSlot(k('v1_16_m6_t2', 'T51', 'U51'), '83.96%', '55.46%', '9.22%', '2.78%', '1.65vh')}
        {renderSlot(k('v1_16_m7_t1', 'T55', 'U55'), '83.96%', '62.59%', '9.22%', '2.78%', '1.65vh')}
        {renderSlot(k('v1_16_m7_t2', 'T56', 'U56'), '83.96%', '65.46%', '9.22%', '2.78%', '1.65vh')}
        {renderSlot(k('v1_16_m8_t1', 'T59', 'U59'), '83.96%', '72.22%', '9.22%', '2.87%', '1.65vh')}
        {renderSlot(k('v1_16_m8_t2', 'T60', 'U60'), '83.96%', '75.19%', '9.22%', '2.78%', '1.65vh')}

        {/* Last updated timestamp */}
        <div
          style={{
            position: 'absolute',
            bottom: '0.6%',
            left: '2%',
            fontSize: '1.25vh',
            fontWeight: 700,
            color: '#52426d',
            fontStyle: 'italic',
            WebkitTextStroke: '0.03vh #52426d',
            fontFamily: "'Normalidad Text Medium', 'GS3 Normalidad Text', sans-serif",
          }}
        >
          Cập nhật lần cuối lúc: {dayjs(lastUpdated || 0).format('HH:mm DD/MM/YYYY')}
        </div>
      </div>
    </div>
  );
}
