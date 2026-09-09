'use client';

import React from 'react';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import dayjs from 'dayjs';
import '@/components/events/tft-leaderboard/fonts.css';

export type TFTGroup = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';

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

  // Coords mapped according to group (both original & expanded row numbering supported)
  let coords: Record<string, string[]>;
  const structuredGroup = bracketData?.vongBang?.[`bang${group}`];

  if (group === 'A') {
    coords = {
      v1_m1_t1: ['D15', 'E15', 'D8', 'E8'],
      v1_m1_t2: ['D17', 'E17', 'D9', 'E9'],
      v1_m2_t1: ['D23', 'E23', 'D12', 'E12'],
      v1_m2_t2: ['D25', 'E25', 'D13', 'E13'],
      v2_m1: ['F15', 'G15', 'F17', 'G17', 'E15', 'F8', 'G8', 'F9', 'G9', 'E8'],
      v2_m2: ['F23', 'G23', 'F25', 'G25', 'E23', 'F12', 'G12', 'F13', 'G13', 'E12'],
      top1: ['I19', 'J19', 'I17', 'J17', 'H17', 'I10', 'J10', 'H10', 'I11', 'J11'],
      losers_m1_t1: ['D33', 'E33', 'D35', 'E35', 'D18', 'E18'],
      losers_m1_t2: ['D35', 'E35', 'D37', 'E37', 'D19', 'E19'],
      losers_m2_t1: ['F33', 'G33', 'F18', 'G18'],
      losers_m2_t2: ['F35', 'G35', 'F19', 'G19'],
      top2: ['H33', 'I33', 'H31', 'I31', 'H17', 'I17', 'H18', 'I18'],
    };
  } else if (group === 'B') {
    coords = {
      v1_m1_t1: ['M15', 'N15', 'M8', 'N8'],
      v1_m1_t2: ['M17', 'N17', 'M9', 'N9'],
      v1_m2_t1: ['M23', 'N23', 'M12', 'N12'],
      v1_m2_t2: ['M25', 'N25', 'M13', 'N13'],
      v2_m1: ['O15', 'P15', 'O17', 'P17', 'N15', 'O8', 'P8', 'O9', 'P9', 'N8'],
      v2_m2: ['O23', 'P23', 'O25', 'P25', 'N23', 'O12', 'P12', 'O13', 'P13', 'N12'],
      top1: ['R19', 'S19', 'R17', 'S17', 'Q17', 'R10', 'S10', 'Q10', 'R11', 'S11'],
      losers_m1_t1: ['M33', 'N33', 'M35', 'N35', 'M18', 'N18'],
      losers_m1_t2: ['M35', 'N35', 'M37', 'N37', 'M19', 'N19'],
      losers_m2_t1: ['O33', 'P33', 'O18', 'P18'],
      losers_m2_t2: ['O35', 'P35', 'O19', 'P19'],
      top2: ['Q33', 'R33', 'Q31', 'R31', 'Q17', 'R17', 'Q18', 'R18'],
    };
  } else if (group === 'C') {
    coords = {
      v1_m1_t1: ['D49', 'E49', 'D51', 'E51', 'D25', 'E25'],
      v1_m1_t2: ['D51', 'E51', 'D53', 'E53', 'D26', 'E26'],
      v1_m2_t1: ['D57', 'E57', 'D29', 'E29'],
      v1_m2_t2: ['D59', 'E59', 'D30', 'E30'],
      v2_m1: ['F49', 'G49', 'F51', 'G51', 'E49', 'F25', 'G25', 'F26', 'G26', 'E25'],
      v2_m2: ['F57', 'G57', 'F59', 'G59', 'E57', 'F29', 'G29', 'F30', 'G30', 'E29'],
      top1: ['I53', 'J53', 'I51', 'J51', 'H51', 'I27', 'J27', 'H27', 'I28', 'J28'],
      losers_m1_t1: ['D67', 'E67', 'D35', 'E35'],
      losers_m1_t2: ['D69', 'E69', 'D36', 'E36'],
      losers_m2_t1: ['F67', 'G67', 'F35', 'G35'],
      losers_m2_t2: ['F69', 'G69', 'F36', 'G36'],
      top2: ['H67', 'I67', 'H65', 'I65', 'H34', 'I34', 'H35', 'I35'],
    };
  } else if (group === 'D') {
    coords = {
      v1_m1_t1: ['M49', 'N49', 'M51', 'N51', 'M25', 'N25'],
      v1_m1_t2: ['M51', 'N51', 'M53', 'N53', 'M26', 'N26'],
      v1_m2_t1: ['M57', 'N57', 'M29', 'N29'],
      v1_m2_t2: ['M59', 'N59', 'M30', 'N30'],
      v2_m1: ['O49', 'P49', 'O51', 'P51', 'N49', 'O25', 'P25', 'O26', 'P26', 'N25'],
      v2_m2: ['O57', 'P57', 'O59', 'P59', 'N57', 'O29', 'P29', 'O30', 'P30', 'N29'],
      top1: ['R53', 'S53', 'R51', 'S51', 'Q51', 'R27', 'S27', 'Q27', 'R28', 'S28'],
      losers_m1_t1: ['M67', 'N67', 'M35', 'N35'],
      losers_m1_t2: ['M69', 'N69', 'M36', 'N36'],
      losers_m2_t1: ['O67', 'P67', 'O35', 'P35'],
      losers_m2_t2: ['O69', 'P69', 'O36', 'P36'],
      top2: ['Q67', 'R67', 'Q65', 'R65', 'Q34', 'R34', 'Q35', 'R35'],
    };
  } else if (group === 'E') {
    // BẢNG E: Cột V..AC (hàng tương ứng Bảng A)
    coords = {
      v1_m1_t1: ['V15', 'W15', 'V8', 'W8'],
      v1_m1_t2: ['V17', 'W17', 'V9', 'W9'],
      v1_m2_t1: ['V23', 'W23', 'V12', 'W12'],
      v1_m2_t2: ['V25', 'W25', 'V13', 'W13'],
      v2_m1: ['X15', 'Y15', 'X17', 'Y17', 'W15', 'X8', 'Y8', 'X9', 'Y9', 'W8'],
      v2_m2: ['X23', 'Y23', 'X25', 'Y25', 'W23', 'X12', 'Y12', 'X13', 'Y13', 'W12'],
      top1: ['AA19', 'AB19', 'AA17', 'AB17', 'Z17', 'AA10', 'AB10', 'Z10', 'AA11', 'AB11'],
      losers_m1_t1: ['V33', 'W33', 'V35', 'W35', 'V18', 'W18'],
      losers_m1_t2: ['V35', 'W35', 'V37', 'W37', 'V19', 'W19'],
      losers_m2_t1: ['X33', 'Y33', 'X18', 'Y18'],
      losers_m2_t2: ['X35', 'Y35', 'X19', 'Y19'],
      top2: ['Z33', 'AA33', 'Z31', 'AA31', 'Z17', 'AA17', 'Z18', 'AA18'],
    };
  } else if (group === 'F') {
    // BẢNG F: Cột AE..AJ (hàng tương ứng Bảng B)
    coords = {
      v1_m1_t1: ['AE15', 'AF15', 'AE8', 'AF8'],
      v1_m1_t2: ['AE17', 'AF17', 'AE9', 'AF9'],
      v1_m2_t1: ['AE23', 'AF23', 'AE12', 'AF12'],
      v1_m2_t2: ['AE25', 'AF25', 'AE13', 'AF13'],
      v2_m1: ['AG15', 'AH15', 'AG17', 'AH17', 'AF15', 'AG8', 'AH8', 'AG9', 'AH9', 'AF8'],
      v2_m2: ['AG23', 'AH23', 'AG25', 'AH25', 'AF23', 'AG12', 'AH12', 'AG13', 'AH13', 'AF12'],
      top1: ['AJ19', 'AK19', 'AJ17', 'AK17', 'AI17', 'AJ10', 'AK10', 'AI10', 'AJ11', 'AK11'],
      losers_m1_t1: ['AE33', 'AF33', 'AE35', 'AF35', 'AE18', 'AF18'],
      losers_m1_t2: ['AE35', 'AF35', 'AE37', 'AF37', 'AE19', 'AF19'],
      losers_m2_t1: ['AG33', 'AH33', 'AG18', 'AH18'],
      losers_m2_t2: ['AG35', 'AH35', 'AG19', 'AH19'],
      top2: ['AI33', 'AJ33', 'AI31', 'AJ31', 'AI17', 'AJ17', 'AI18', 'AJ18'],
    };
  } else if (group === 'G') {
    // BẢNG G: Cột V..AC (hàng tương ứng Bảng C)
    coords = {
      v1_m1_t1: ['V49', 'W49', 'V51', 'W51', 'V25', 'W25'],
      v1_m1_t2: ['V51', 'W51', 'V53', 'W53', 'V26', 'W26'],
      v1_m2_t1: ['V57', 'W57', 'V29', 'W29'],
      v1_m2_t2: ['V59', 'W59', 'V30', 'W30'],
      v2_m1: ['X49', 'Y49', 'X51', 'Y51', 'W49', 'X25', 'Y25', 'X26', 'Y26', 'W25'],
      v2_m2: ['X57', 'Y57', 'X59', 'Y59', 'W57', 'X29', 'Y29', 'X30', 'Y30', 'W29'],
      top1: ['AA53', 'AB53', 'AA51', 'AB51', 'Z51', 'AA27', 'AB27', 'Z27', 'AA28', 'AB28'],
      losers_m1_t1: ['V67', 'W67', 'V35', 'W35'],
      losers_m1_t2: ['V69', 'W69', 'V36', 'W36'],
      losers_m2_t1: ['X67', 'Y67', 'X35', 'Y35'],
      losers_m2_t2: ['X69', 'Y69', 'X36', 'Y36'],
      top2: ['Z67', 'AA67', 'Z65', 'AA65', 'Z34', 'AA34', 'Z35', 'AA35'],
    };
  } else {
    // BẢNG H: Cột AE..AJ (hàng tương ứng Bảng D)
    coords = {
      v1_m1_t1: ['AE49', 'AF49', 'AE51', 'AF51', 'AE25', 'AF25'],
      v1_m1_t2: ['AE51', 'AF51', 'AE53', 'AF53', 'AE26', 'AF26'],
      v1_m2_t1: ['AE57', 'AF57', 'AE29', 'AF29'],
      v1_m2_t2: ['AE59', 'AF59', 'AE30', 'AF30'],
      v2_m1: ['AG49', 'AH49', 'AG51', 'AH51', 'AF49', 'AG25', 'AH25', 'AG26', 'AH26', 'AF25'],
      v2_m2: ['AG57', 'AH57', 'AG59', 'AH59', 'AF57', 'AG29', 'AH29', 'AG30', 'AH30', 'AF29'],
      top1: ['AJ53', 'AK53', 'AJ51', 'AK51', 'AI51', 'AJ27', 'AK27', 'AI27', 'AJ28', 'AK28'],
      losers_m1_t1: ['AE67', 'AF67', 'AE35', 'AF35'],
      losers_m1_t2: ['AE69', 'AF69', 'AE36', 'AF36'],
      losers_m2_t1: ['AG67', 'AH67', 'AG35', 'AH35'],
      losers_m2_t2: ['AG69', 'AH69', 'AG36', 'AH36'],
      top2: ['AI67', 'AJ67', 'AI65', 'AJ65', 'AI34', 'AJ34', 'AI35', 'AJ35'],
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

        {/* Purple Badge: BẢNG A / B / C / D / E / F / G / H */}
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
