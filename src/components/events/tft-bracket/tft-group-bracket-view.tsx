'use client';

import React from 'react';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import dayjs from 'dayjs';
import '@/components/events/tft-leaderboard/fonts.css';

export type TFTGroup = 'A' | 'B' | 'C' | 'D';

interface TFTGroupBracketViewProps {
  group: TFTGroup;
}

const BG_VONG_BANG = 'https://media.etik.vn/tft-2026/BRACKET_4V4_VONG_BANG.png';

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

export default function TFTGroupBracketView({ group }: TFTGroupBracketViewProps): React.JSX.Element {
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

  const titleText = `BẢNG ${group}`;

  // Helper render text inside box slot - perfectly centered both horizontally and vertically
  const renderSlot = (
    text: string,
    left: string,
    top: string,
    width: string,
    height: string,
    fontSize: string = '2.1vh',
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
          padding: '0 0.8vh',
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

  // Coords mapped according to group
  let coords: Record<string, string[]>;
  const structuredGroup = bracketData?.vongBang?.[`bang${group}`];

  if (group === 'A') {
    coords = {
      v1_m1_t1: ['D8', 'E8'],
      v1_m1_t2: ['D9', 'E9'],
      v1_m2_t1: ['D12', 'E12'],
      v1_m2_t2: ['D13', 'E13'],
      v2_m1: ['F8', 'G8', 'F9', 'G9', 'E8'],
      v2_m2: ['F12', 'G12', 'F13', 'G13', 'E12'],
      top1: ['I10', 'J10', 'H10', 'I11', 'J11'],
      losers_m1_t1: ['D18', 'E18'],
      losers_m1_t2: ['D19', 'E19'],
      losers_m2_t1: ['F18', 'G18'],
      losers_m2_t2: ['F19', 'G19'],
      top2: ['H17', 'I17', 'H18', 'I18'],
    };
  } else if (group === 'B') {
    coords = {
      v1_m1_t1: ['M8', 'N8'],
      v1_m1_t2: ['M9', 'N9'],
      v1_m2_t1: ['M12', 'N12'],
      v1_m2_t2: ['M13', 'N13'],
      v2_m1: ['O8', 'P8', 'O9', 'P9', 'N8'],
      v2_m2: ['O12', 'P12', 'O13', 'P13', 'N12'],
      top1: ['R10', 'S10', 'Q10', 'R11', 'S11'],
      losers_m1_t1: ['M18', 'N18'],
      losers_m1_t2: ['M19', 'N19'],
      losers_m2_t1: ['O18', 'P18'],
      losers_m2_t2: ['O19', 'P19'],
      top2: ['Q17', 'R17', 'Q18', 'R18'],
    };
  } else if (group === 'C') {
    coords = {
      v1_m1_t1: ['D25', 'E25'],
      v1_m1_t2: ['D26', 'E26'],
      v1_m2_t1: ['D29', 'E29'],
      v1_m2_t2: ['D30', 'E30'],
      v2_m1: ['F25', 'G25', 'F26', 'G26', 'E25'],
      v2_m2: ['F29', 'G29', 'F30', 'G30', 'E29'],
      top1: ['I27', 'J27', 'H27', 'I28', 'J28'],
      losers_m1_t1: ['D35', 'E35'],
      losers_m1_t2: ['D36', 'E36'],
      losers_m2_t1: ['F35', 'G35'],
      losers_m2_t2: ['F36', 'G36'],
      top2: ['H34', 'I34', 'H35', 'I35'],
    };
  } else {
    // D
    coords = {
      v1_m1_t1: ['M25', 'N25'],
      v1_m1_t2: ['M26', 'N26'],
      v1_m2_t1: ['M29', 'N29'],
      v1_m2_t2: ['M30', 'N30'],
      v2_m1: ['O25', 'P25', 'O26', 'P26', 'N25'],
      v2_m2: ['O29', 'P29', 'O30', 'P30', 'N29'],
      top1: ['R27', 'S27', 'Q27', 'R28', 'S28'],
      losers_m1_t1: ['M35', 'N35'],
      losers_m1_t2: ['M36', 'N36'],
      losers_m2_t1: ['O35', 'P35'],
      losers_m2_t2: ['O36', 'P36'],
      top2: ['Q34', 'R34', 'Q35', 'R35'],
    };
  }

  const t = (key: string, ...structKeys: string[]) => {
    if (structuredGroup) {
      for (const sk of structKeys) {
        if (structuredGroup[sk] && String(structuredGroup[sk]).trim()) {
          return String(structuredGroup[sk]).trim();
        }
      }
    }
    const targetCoords = coords[key] || [];
    return getVal(bracketData, ...targetCoords);
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
          src={BG_VONG_BANG}
          alt={`Bracket Vòng Bảng - ${titleText}`}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            objectFit: 'contain',
            userSelect: 'none',
          }}
        />

        {/* Purple Badge: BẢNG A / B / C / D */}
        <div
          style={{
            position: 'absolute',
            left: '42.86%',
            top: '28.61%',
            width: '14.22%',
            height: '3.61%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontSize: '2.4vh',
            fontWeight: 800,
            letterSpacing: '0.08em',
            WebkitTextStroke: '0.03vh #ffffff',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            userSelect: 'none',
          }}
        >
          {titleText}
        </div>

        {/* VÒNG 1 (Cột 1 trên: left 10.42%, width 17.97%) */}
        {renderSlot(t('v1_m1_t1', 'vong1_m1_t1'), '10.42%', '37.22%', '17.97%', '5.56%')}
        {renderSlot(t('v1_m1_t2', 'vong1_m1_t2'), '10.42%', '42.96%', '17.97%', '5.46%')}
        {renderSlot(t('v1_m2_t1', 'vong1_m2_t1'), '10.42%', '56.48%', '17.97%', '5.56%')}
        {renderSlot(t('v1_m2_t2', 'vong1_m2_t2'), '10.42%', '62.22%', '17.97%', '5.46%')}

        {/* NHÁNH THUA (Cột 1 dưới: left 10.42%, width 17.97%) */}
        {renderSlot(t('losers_m1_t1', 'nhanhThua_m1_t1'), '10.42%', '79.72%', '17.97%', '5.46%')}
        {renderSlot(t('losers_m1_t2', 'nhanhThua_m1_t2'), '10.42%', '85.46%', '17.97%', '5.46%')}

        {/* VÒNG 2: 2 ô to đơn căn giữa, cỡ chữ 2.5vh đậm 800 giống ô Đội 2 - 0 */}
        {/* Ô trên Vòng 2: Bounding box x=[765..1113] w=349 y=[402..522] h=121 */}
        {renderSlot(t('v2_m1', 'vong2_m1', 'vong2_m1_t1', 'vong2_m1_t2'), '39.84%', '37.22%', '18.18%', '11.20%', '2.5vh', 800)}

        {/* Ô dưới Vòng 2: Bounding box x=[765..1113] w=349 y=[610..730] h=121 */}
        {renderSlot(t('v2_m2', 'vong2_m2', 'vong2_m2_t1', 'vong2_m2_t2'), '39.84%', '56.48%', '18.18%', '11.20%', '2.5vh', 800)}

        {/* NHÁNH THUA VÒNG 2 (Cột 2 dưới: left 39.84%, width 18.15%) */}
        {renderSlot(t('losers_m2_t1', 'nhanhThua_m2_t1'), '39.84%', '74.26%', '18.15%', '5.56%')}
        {renderSlot(t('losers_m2_t2', 'nhanhThua_m2_t2'), '39.84%', '80.00%', '18.15%', '5.46%')}

        {/* ĐỘI 2 - 0 (top1): Bounding box chuẩn xác của ô xanh x=[1395..1743] w=349 y=[507..620] h=114 */}
        {renderSlot(t('top1', 'top1_2_0'), '72.66%', '46.94%', '18.18%', '10.56%', '2.5vh', 800)}

        {/* ĐỘI 2 - 1 (top2): Bounding box chuẩn xác của ô xanh x=[1251..1599] w=349 y=[798..917] h=120 */}
        {renderSlot(t('top2', 'top2_2_1'), '65.16%', '73.89%', '18.18%', '11.11%', '2.5vh', 800)}

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
