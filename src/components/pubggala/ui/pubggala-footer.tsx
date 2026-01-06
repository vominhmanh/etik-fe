'use client';

import Image from 'next/image';
import facebookIcon from '@/images/pubg/facebook.svg';
import kraftonLogo from '@/images/pubg/kfrafton.png';
import logo from '@/images/pubg/logo.png';
import tiktokIcon from '@/images/pubg/tiktok.svg';
import { Container } from '@mui/material';

import { useTranslation } from '@/contexts/locale-context';
import { YoutubeLogo } from '@phosphor-icons/react/dist/ssr';

export default function PubgGalaFooter() {
  const { tt } = useTranslation();

  return (
    <footer className="relative w-full bg-black py-8 md:py-12">
      {/* Border top with gradient */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, rgba(225, 198, 147, 0) 0%, #E1C693 50%, rgba(225, 198, 147, 0) 100%)',
          zIndex: 1,
        }}
      />
      <Container maxWidth="xl" className="w-full">
        {/* Top Section: Logo/Description on left, Social/Organizing Unit on right */}
        <div className="flex flex-col md:flex-row gap-8 justify-between items-start">
          {/* Left: Logo and Description */}
          <div className="flex flex-col gap-10" style={{ flex: '1 1 0%' }}>
            <div className="flex gap-1">
              <Image
                src={logo}
                alt="PUBG GALA 2025"
                width={40}
                height={40}
                className="h-auto"
                style={{ height: 'auto' }}
              />
              <div>
                <span
                  style={{
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                    fontSize: '14px',
                    lineHeight: '20px',
                    color: '#FFFFFF',
                  }}
                >
                  PUBG GALA 2025
                </span>
                <br />
                <span
                  style={{
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                    fontWeight: 700,
                    fontSize: '14px',
                    lineHeight: '20px',
                    color: '#FFFFFF',
                  }}
                >
                  GALA OF GLORY
                </span>
              </div>
            </div>
            <p
              style={{
                fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                fontWeight: 400,
                fontSize: '14px',
                lineHeight: '20px',
                color: '#FFFFFF',
                textAlign: 'left',
                maxWidth: '400px',
              }}
            >
              {tt(
                'PUBG GALA 2025 là Lễ Vinh Danh & Trao Giải cuối năm, nơi tôn vinh những con người, khoảnh khắc và giá trị đã góp phần tạo nên một năm 2025 đầy dấu ấn, với chủ đề "Gala of Glory".',
                'PUBG Gala 2025 is the annual award ceremony and prize giving event, where we honor the people, moments, and values that have contributed to making 2025 a year of significant impact, with the theme "Gala of Glory".'
              )}
            </p>
          </div>

          {/* Right: Social Media and Organizing Unit */}
          <div className="flex flex-col gap-10 md:gap-12 items-start md:items-end">
            {/* Social Media */}
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-center items-start sm:items-center">
              <h4
                className="text-xs md:text-sm"
                style={{
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                  fontWeight: 500,
                  lineHeight: '16px',
                  textTransform: 'uppercase',
                  color: '#FFFFFF',
                }}
              >
                {tt('THEO DÕI CHÚNG TÔI TẠI', 'FOLLOW US AT')}
              </h4>
              <div className="flex gap-4">
                <a
                  href="https://www.facebook.com/pubg.battlegrounds.vietnam"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center"
                >
                  <Image src={facebookIcon} alt="Facebook" width={20} height={20} />
                </a>
                <a
                  href="https://tiktok.com/@pubg_battlegrounds_vn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center"
                >
                  <Image src={tiktokIcon} alt="TikTok" width={18} height={20} />
                </a>
                <a
                  href="https://youtube.com/@PUBGBATTLEGROUNDSVIETNAM"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center"
                >
                  <YoutubeLogo size={18} weight="fill" color="#FFFFFF" />
                </a>
              </div>
            </div>

            {/* Organizing Unit */}
            <div className="flex flex-col gap-3 md:gap-4">
              <h4
                className="text-xs md:text-sm"
                style={{
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                  fontWeight: 500,
                  lineHeight: '16px',
                  textTransform: 'uppercase',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  textAlign: 'right',
                }}
              >
                {tt('ĐƠN VỊ TỔ CHỨC', 'ORGANIZING UNIT')}
              </h4>
              <div className="flex gap-4 md:gap-6 items-center">
                <Image
                  src={kraftonLogo}
                  alt="KRAFTON. Inc."
                  width={120}
                  height={40}
                  className="h-auto w-24 md:w-[120px]"
                  style={{ height: 'auto' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            marginTop: '32px',
            height: '1px',
            background: 'linear-gradient(90deg, rgba(225, 198, 147, 0) 0%, #E1C693 50%, rgba(225, 198, 147, 0) 100%)',
          }}
        />

        {/* Copyright */}
        <div style={{ marginTop: '32px' }} className="text-left md:text-right">
          <p
            className="text-xs md:text-xs"
            style={{
              fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
              fontWeight: 400,
              lineHeight: '16px',
              color: '#FFFFFF',
            }}
          >
            © 2026 PUBG GALA. All rights reserved.
            <br />
            Powered by KRAFTON. Inc.
          </p>
        </div>
      </Container>
    </footer>
  );
}
