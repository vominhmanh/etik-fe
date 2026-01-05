'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import battlegroundsImage from '@/images/pubg/battlegrounds.png';
import blackButtonBgImage from '@/images/pubg/black-button-bg.png';
import buttonBackgroundImage from '@/images/pubg/button-background.png';
import cafefLogo from '@/images/pubg/cafef.png';
import cardBackgroundImage from '@/images/pubg/card-background.png';
import chickenWinnerImage from '@/images/pubg/chicken-winner.png';
import facebookIcon from '@/images/pubg/facebook.svg';
import heartIcon from '@/images/pubg/heart.svg';
import backgroundImage from '@/images/pubg/KV_PUBG_GALA_16x9.jpg';
import logo from '@/images/pubg/logo.png';
import soldierBackgroundImage from '@/images/pubg/soldier-background.png';
import tiktokIcon from '@/images/pubg/tiktok.svg';
import vccorpLogo from '@/images/pubg/vccorp.png';
import votingService from '@/services/Voting.service';
import { Box, Container, Dialog, Grid, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import dayjs from 'dayjs';
import dynamic from 'next/dynamic';
import { CaretDoubleUp } from '@phosphor-icons/react/dist/ssr';

import { Category } from '@/types/voting';
import { useTranslation } from '@/contexts/locale-context';
import { LocalizedLink } from '@/components/pubggala/localized-link';
import PubgGalaPageHeader from '@/components/pubggala/ui/pubggala-page-header';
import PubgGalaFooter from '@/components/pubggala/ui/pubggala-footer';

const FacebookSDK = dynamic(
  () => import('@/components/pubggala/FacebookSDK'),
  { ssr: false }
);

const FBPost = dynamic(
  () => import('@/components/pubggala/FBPost'),
  { ssr: false }
);

export default function Home() {
  const { tt } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSocialIframe, setSelectedSocialIframe] = useState<string>('');
  const [selectedSocialUrl, setSelectedSocialUrl] = useState<string>('');
  const [selectedVoteCount, setSelectedVoteCount] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedNominee, setSelectedNominee] = useState<{ title: string; updatedAt?: string } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => setIsMobile(window.innerWidth <= 768);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await votingService.getAllInfo(51);
        if (response.data?.categories) {
          // Sort nominees by voteCount in descending order for each category
          const sortedCategories = response.data.categories.map((category) => ({
            ...category,
            nominees: category.nominees
              ? [...category.nominees].sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0))
              : [],
          }));
          setCategories(sortedCategories);
        }
      } catch (error) {
        console.error('Error fetching voting data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Format category number with leading zero
  const formatCategoryNumber = (index: number) => {
    return String(index + 1).padStart(2, '0');
  };

  // Separate categories by allowVoting
  const votingCategories = categories.filter((cat) => cat.allowVoting === true);
  const honoredCategories = categories.filter((cat) => cat.allowVoting === false);

  // Strip HTML tags to get plain text for title attribute
  const stripHtmlTags = (html: string): string => {
    if (typeof window !== 'undefined') {
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || '';
    }
    return html.replace(/<[^>]*>/g, '');
  };

  // Scroll to category section
  const scrollToCategory = (categoryIndex: number) => {
    if (categories.length > 0 && categories[categoryIndex]) {
      const categoryId = categories[categoryIndex].id;
      const element = document.getElementById(`category-${categoryId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Handle vote button click
  const handleVoteClick = (
    socialIframe: string,
    socialUrl: string,
    voteCount: number = 0,
    category?: Category,
    nominee?: { title: string; updatedAt?: string }
  ) => {
    if (socialIframe) {
      setSelectedSocialIframe(socialIframe);
      setSelectedSocialUrl(socialUrl || '');
      setSelectedVoteCount(voteCount);
      setSelectedCategory(category || null);
      setSelectedNominee(nominee || null);
      setDialogOpen(true);
    }
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedSocialIframe('');
    setSelectedSocialUrl('');
    setSelectedVoteCount(0);
    setSelectedCategory(null);
    setSelectedNominee(null);
  };

  return (
    <div className="relative w-full">
      {/* Load Facebook SDK only on mobile (XFBML mode) */}
      {isMobile && <FacebookSDK />}
      {/* Body1: Background Image with Content */}
      <div className="relative h-[600px] md:h-[800px] w-full" style={{ backgroundColor: '#000000' }}>
        {/* Background Image with Gradient Overlay */}
        <div className="absolute top-0 left-0 w-full h-full pt-[60px] md:pt-20">
          <Image
            src={backgroundImage}
            alt="PUBG GALA Background"
            width={1920}
            height={1080}
            priority
            className="w-full h-full"
            style={{ zIndex: 0, objectFit: 'cover', width: '100%', height: '100%', display: 'block' }}
            sizes="100vw"
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(94.87deg, #000000 -3.8%, rgba(0, 0, 0, 0) 104.83%)',
              zIndex: 1,
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Header */}
        <div className="absolute top-0 left-0 w-full z-20">
          <PubgGalaPageHeader />
        </div>

        {/* Content Area */}
        <div className="absolute inset-0 z-10 flex items-center pt-8 md:pt-14 px-4">
          <Container maxWidth="xl" className="w-full">
            <div className="flex flex-col gap-4 md:gap-6 w-full" data-aos="fade-right">
              {/* Title */}
              <div className="gap-3">
                <h3
                  className="text-xl sm:text-3xl md:text-4xl lg:text-5xl leading-tight md:leading-tight"
                  style={{
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    textTransform: 'uppercase',
                    color: '#E1C693',
                    flex: 'none',
                    order: 0,
                    alignSelf: 'stretch',
                    flexGrow: 0,
                  }}
                >
                  {tt('BẢNG VINH DANH', 'HALL OF FAME')}
                </h3>
                <h3
                  className="text-xl sm:text-3xl md:text-4xl lg:text-5xl leading-tight md:leading-tight"
                  style={{
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    textTransform: 'uppercase',
                    color: '#E1C693',
                    flex: 'none',
                    order: 0,
                    alignSelf: 'stretch',
                    flexGrow: 0,
                  }}
                >
                  {tt('PUBG GALA 2025:', 'PUBG GALA 2025:')}
                </h3>
              </div>

              <h1
                className="text-3xl sm:text-5xl md:text-6xl lg:text-[72px] leading-tight md:leading-[76px]"
                style={
                  {
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                    fontStyle: 'normal',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    textTransform: 'uppercase',
                    background: 'linear-gradient(90deg, #E1C693 0%, #FFFFFF 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    flex: 'none',
                    order: 0,
                    alignSelf: 'stretch',
                    flexGrow: 0,
                  } as React.CSSProperties
                }
              >
                {tt('GALA OF GLORY', 'GALA OF GLORY')}
              </h1>

              {/* Description */}
              <p
                className="text-sm sm:text-base md:text-lg"
                style={{
                  width: '100%',
                  maxWidth: '476px',
                  height: 'auto',
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                  fontStyle: 'normal',
                  fontWeight: 900,
                  lineHeight: '1.3',
                  display: 'flex',
                  alignItems: 'center',
                  color: '#FFFFFF',
                  flex: 'none',
                  order: 0,
                  flexGrow: 0,
                }}
                dangerouslySetInnerHTML={{
                  __html: tt(
                    'Tham gia bình chọn và cùng chúng tôi vinh danh những cá nhân, tập thể và dấu ấn đáng nhớ của PUBG Việt Nam trong năm 2025.',
                    "Join us in voting and honoring the individuals, teams, and memorable moments of PUBG Vietnam in 2025."
                  ).replace(/\n\n/g, '<br /><br />').replace(/\n/g, '<br />')
                }}
              />

              {/* Button */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  isolation: 'isolate',
                  flex: 'none',
                  order: 1,
                  flexGrow: 0,
                }}
              >
                <LocalizedLink
                  href="/events/pubggala/vote"
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textDecoration: 'none',
                    flex: 'none',
                    order: 1,
                    flexGrow: 0,
                    zIndex: 1,
                    cursor: 'pointer',
                    transition: 'opacity 0.2s ease',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  <div className="w-40 sm:w-48 md:w-[220px] h-12 sm:h-14 md:h-[60px]" style={{ position: 'relative' }}>
                    <Image src={buttonBackgroundImage} alt={tt('Bình chọn', 'Vote')} fill priority />
                    {/* Text overlay */}
                    <span
                      className="text-sm sm:text-base md:text-xl"
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                        fontStyle: 'normal',
                        fontWeight: 900,
                        lineHeight: '1.2',
                        textAlign: 'center',
                        textTransform: 'uppercase',
                        color: '#121026',
                        zIndex: 2,
                        pointerEvents: 'none',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {tt('Bình chọn ngay', 'Vote now')}
                    </span>
                  </div>
                </LocalizedLink>
              </div>
            </div>
          </Container>
        </div>
      </div>

      {/* Body2: Message Section */}

      <div
        className="relative z-10 w-full flex items-start py-8 md:py-16"
        style={{
          background: 'linear-gradient(165.61deg, rgb(50, 50, 50) -4.98%, rgb(0, 0, 0) 107.54%)',
        }}
      >
        <Container maxWidth="xl" className="w-full">
          <div className="flex flex-col gap-2 md:gap-4" data-aos="zoom-out">
            {/* Title 1: Những hạng mục vinh danh & bình chọn */}
            <h3
              className="text-base md:text-xl"
              style={{
                fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                fontStyle: 'normal',
                fontWeight: 500,
                lineHeight: '24px',
                letterSpacing: '0%',
                textAlign: 'center',
                verticalAlign: 'middle',
                textTransform: 'uppercase',
                color: 'rgba(255, 255, 255, 1)',
                margin: 0,
              }}
            >
              {tt('Danh sách hạng mục trao giải', 'Award Categories List')}
            </h3>

            {/* Title 2: pubg gala 2025 : gala of glory */}
            <h2
              className="text-2xl md:text-4xl md:leading-[48px]"
              style={
                {
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                  fontStyle: 'normal',
                  fontWeight: 900,
                  lineHeight: '32px',
                  letterSpacing: '0%',
                  textAlign: 'center',
                  verticalAlign: 'middle',
                  textTransform: 'uppercase',
                  background: 'linear-gradient(90deg, #E1C693 0%, #FFFFFF 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  margin: 0,
                } as React.CSSProperties
              }
            >
              {tt('pubg gala 2025', 'PUBG GALA 2025')}
            </h2>

            {/* Voting Categories List Section */}
            <div
              className="flex flex-col mt-6 p-4 md:p-6"
              style={{
                background: 'linear-gradient(165.61deg, rgb(50, 50, 50) -4.98%, rgb(0, 0, 0) 107.54%)',
                borderRadius: '8px',
              }}
            >
              {/* Title: Hạng mục Bình chọn */}
              <h2
                className="text-lg md:text-2xl mb-6 md:mb-8"
                style={{
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                  fontStyle: 'normal',
                  fontWeight: 900,
                  letterSpacing: '0%',
                  textAlign: 'left',
                  verticalAlign: 'middle',
                  textTransform: 'uppercase',
                  color: 'rgba(255, 255, 255, 1)',
                }}
              >
                {tt('Hạng mục Bình chọn', 'Voting Categories')}
              </h2>

              {/* List of Categories */}
              <div className="flex flex-col">
                {votingCategories.map((category, index) => (
                  <div
                    key={category.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-3 sm:gap-4 w-full p-4"
                    style={{
                      borderBottom: index < votingCategories.length - 1 ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
                      backgroundImage: `url(${cardBackgroundImage.src})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      position: 'relative',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      const categoryIndex = categories.findIndex((cat) => cat.id === category.id);
                      if (categoryIndex !== -1) {
                        scrollToCategory(categoryIndex);
                      }
                    }}
                  >
                    {/* Number Box */}
                    <Stack direction="row" spacing={2}>
                      <div
                        className="w-10 h-7 md:w-[70px] md:h-[45px] flex-shrink-0"
                        style={{
                          backgroundColor: 'rgba(225, 198, 147, 1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          paddingLeft: '10px',
                          paddingRight: '10px',
                        }}
                      >
                        <span
                          className="text-xl md:text-4xl"
                          style={{
                            fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                            fontStyle: 'normal',
                            fontWeight: 800,
                            lineHeight: '44.28px',
                            letterSpacing: '0%',
                            textAlign: 'center',
                            verticalAlign: 'middle',
                            textTransform: 'uppercase',
                            color: 'rgba(18, 16, 38, 1)',
                          }}
                        >
                          {formatCategoryNumber(index)}
                        </span>
                      </div>

                      {/* Category Name */}
                      <div className="flex-1 min-w-0">
                        <h3
                          className="text-sm md:text-3xl break-words"
                          style={
                            {
                              fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                              fontStyle: 'normal',
                              fontWeight: 900,
                              letterSpacing: '0%',
                              textAlign: 'left',
                              verticalAlign: 'middle',
                              textTransform: 'uppercase',
                              background: 'linear-gradient(90deg, #E1C693 0%, #FFFFFF 100%)',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              backgroundClip: 'text',
                              margin: 0,
                            } as React.CSSProperties
                          }
                        >
                          {tt(category.name, category.name)}
                        </h3>
                      </div>
                    </Stack>
                    {/* Vote Button - Desktop only */}
                    <div className="hidden md:block relative w-full sm:w-auto flex-shrink-0 sm:px-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const categoryIndex = categories.findIndex((cat) => cat.id === category.id);
                          if (categoryIndex !== -1) {
                            scrollToCategory(categoryIndex);
                          }
                        }}
                        className="w-full sm:w-[240px] h-[50px] sm:h-[55px] cursor-pointer"
                        style={{ position: 'relative', background: 'none', border: 'none', padding: 0 }}
                      >
                        <Image
                          src={blackButtonBgImage}
                          alt={tt('Bình chọn', 'Vote')}
                          fill
                          style={{ objectFit: 'contain' }}
                        />
                        {/* Text overlay */}
                        <span
                          className="text-base md:text-lg"
                          style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                            fontStyle: 'normal',
                            fontWeight: 900,
                            lineHeight: '1.2',
                            textAlign: 'center',
                            textTransform: 'uppercase',
                            color: 'rgba(255, 255, 255, 1)',
                            zIndex: 2,
                            pointerEvents: 'none',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {tt('Bình chọn', 'Vote')}
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {/* Vote Button - Mobile only */}
              <div className="block md:hidden relative w-full sm:w-auto flex-shrink-0 sm:px-4 mt-4">
                <button
                  onClick={() => {
                    if (votingCategories.length > 0) {
                      const categoryIndex = categories.findIndex((cat) => cat.id === votingCategories[0].id);
                      if (categoryIndex !== -1) {
                        scrollToCategory(categoryIndex);
                      }
                    }
                  }}
                  className="w-full sm:w-[240px] h-[50px] sm:h-[55px] cursor-pointer"
                  style={{ position: 'relative', background: 'none', border: 'none', padding: 0 }}
                >
                  <Image
                    src={blackButtonBgImage}
                    alt={tt('Bình chọn', 'Vote')}
                    fill
                    style={{ objectFit: 'contain' }}
                  />
                  {/* Text overlay */}
                  <span
                    className="text-base md:text-lg"
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                      fontStyle: 'normal',
                      fontWeight: 900,
                      lineHeight: '1.2',
                      textAlign: 'center',
                      textTransform: 'uppercase',
                      color: 'rgba(255, 255, 255, 1)',
                      zIndex: 2,
                      pointerEvents: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {tt('Bình chọn', 'Vote')}
                  </span>
                </button>
              </div>
            </div>

            {/* Honored Categories List Section */}
            <div
              className="flex flex-col mt-12 md:mt-12 p-4 md:p-6"
              style={{
                background: 'linear-gradient(165.61deg, rgb(50, 50, 50) -4.98%, rgb(0, 0, 0) 107.54%)',
                borderRadius: '8px',
              }}
            >
              {/* Title: Hạng mục Vinh danh */}
              <h2
                className="text-lg md:text-2xl mb-6 md:mb-8"
                style={{
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                  fontStyle: 'normal',
                  fontWeight: 900,
                  letterSpacing: '0%',
                  textAlign: 'left',
                  verticalAlign: 'middle',
                  textTransform: 'uppercase',
                  color: 'rgba(255, 255, 255, 1)',
                }}
              >
                {tt('Hạng mục Vinh danh', 'Honored Categories')}
              </h2>

              {/* List of Honored Categories */}
              <div className="flex flex-col">
                {honoredCategories.map((category, index) => (
                  <div
                    key={category.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full p-4"
                    style={{
                      borderBottom: index < honoredCategories.length - 1 ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
                      backgroundImage: `url(${cardBackgroundImage.src})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      position: 'relative',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      const categoryIndex = categories.findIndex((cat) => cat.id === category.id);
                      if (categoryIndex !== -1) {
                        scrollToCategory(categoryIndex);
                      }
                    }}
                  >
                    {/* Number Box */}
                    <Stack direction="row" spacing={2}>
                      <div
                        className="w-10 h-7 md:w-[70px] md:h-[45px] flex-shrink-0"
                        style={{
                          backgroundColor: 'rgba(225, 198, 147, 1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          paddingLeft: '10px',
                          paddingRight: '10px',
                        }}
                      >
                        <span
                          className="text-xl md:text-4xl"
                          style={{
                            fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                            fontStyle: 'normal',
                            fontWeight: 800,
                            lineHeight: '44.28px',
                            letterSpacing: '0%',
                            textAlign: 'center',
                            verticalAlign: 'middle',
                            textTransform: 'uppercase',
                            color: 'rgba(18, 16, 38, 1)',
                          }}
                        >
                          {formatCategoryNumber(index)}
                        </span>
                      </div>

                      {/* Category Name */}
                      <div className="flex-1 min-w-0">
                        <h3
                          className="text-sm md:text-3xl break-words"
                          style={
                            {
                              fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                              fontStyle: 'normal',
                              fontWeight: 900,
                              letterSpacing: '0%',
                              textAlign: 'left',
                              verticalAlign: 'middle',
                              textTransform: 'uppercase',
                              background: 'linear-gradient(90deg, #E1C693 0%, #FFFFFF 100%)',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              backgroundClip: 'text',
                              margin: 0,
                            } as React.CSSProperties
                          }
                        >
                          {tt(category.name, category.name)}
                        </h3>
                      </div>
                    </Stack>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </div>


      {/* Voting Categories Info Section */}
      <div className="relative w-full">
        {/* Hidden image to maintain aspect ratio */}
        <Image
          src={battlegroundsImage}
          alt=""
          width={1920}
          height={1080}
          className="w-full h-auto opacity-0 pointer-events-none"
          style={{ display: 'block' }}
          aria-hidden="true"
        />
        {/* Background image overlay */}
        <div
          className="absolute inset-0 w-full"
          style={{
            backgroundImage: `url(${battlegroundsImage.src})`,
            backgroundSize: '100% 100%',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          <div className="absolute inset-0 z-10 w-full flex items-center justify-center py-4 px-4">
            <Container maxWidth="xl" className="w-full">
              <div className="flex flex-col items-center justify-center gap-4 md:gap-8 w-full">
                {/* Title 1: Hạng mục Bình chọn */}
                <h2
                  className="text-2xl md:text-4xl md:leading-[48px]"
                  style={
                    {
                      fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                      fontStyle: 'normal',
                      fontWeight: 900,
                      lineHeight: '32px',
                      letterSpacing: '0%',
                      textAlign: 'center',
                      verticalAlign: 'middle',
                      textTransform: 'uppercase',
                      background: 'linear-gradient(90deg, #E1C693 0%, #FFFFFF 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      margin: 0,
                    } as React.CSSProperties
                  }
                >
                  {tt('Hạng mục Bình chọn', 'Voting Categories')}
                </h2>

                {/* Title 2: kết quả dựa trên 70% bình chọn từ cộng đồng & 30% đánh giá từ ban tổ chức */}
                <p
                  className="text-sm md:text-3xl"
                  style={{
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                    fontStyle: 'normal',
                    fontWeight: 500,
                    lineHeight: '120%',
                    letterSpacing: '0%',
                    textAlign: 'center',
                    verticalAlign: 'middle',
                    textTransform: 'uppercase',
                    color: 'rgba(255, 255, 255, 1)',
                    margin: 0,
                  }}
                >
                  {tt(
                    'kết quả dựa trên 70% bình chọn từ cộng đồng & 30% đánh giá từ BTC',
                    'results based on 70% community voting & 30% organizer evaluation'
                  )}
                </p>
              </div>
            </Container>
          </div>
        </div>
      </div>

      {/* Body3: Categories Section */}
      {!isLoading &&
        categories.map((category, categoryIndex) => (
          <React.Fragment key={category.id}>
            <div
              id={`category-${category.id}`}
              className="relative w-full bg-black py-8 md:py-16"
              style={{
                backgroundImage: `url(${chickenWinnerImage.src})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'repeat',
              }}
            >
              <Container maxWidth="xl" className="w-full">
                <div className="flex flex-col gap-12" data-aos="fade-up">
                  {/* Section Titles */}
                  <div className="flex flex-col gap-2 items-center">
                    {/* Number Box */}
                    <div
                      className="w-10 h-7 md:w-[70px] md:h-[45px] flex-shrink-0"
                      style={{
                        backgroundColor: 'rgba(225, 198, 147, 1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingLeft: '10px',
                        paddingRight: '10px',
                      }}
                    >
                      <span
                        className="text-xl md:text-4xl"
                        style={{
                          fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                          fontStyle: 'normal',
                          fontWeight: 800,
                          lineHeight: '44.28px',
                          letterSpacing: '0%',
                          textAlign: 'center',
                          verticalAlign: 'middle',
                          textTransform: 'uppercase',
                          color: 'rgba(18, 16, 38, 1)',
                        }}
                      >
                        {formatCategoryNumber(categoryIndex)}
                      </span>
                    </div>
                    {/* Title 1 */}
                    <h3
                      style={{
                        fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                        fontWeight: 500,
                        fontStyle: 'normal',
                        fontSize: '20px',
                        lineHeight: '24px',
                        letterSpacing: '0%',
                        textAlign: 'center',
                        verticalAlign: 'middle',
                        textTransform: 'uppercase',
                        color: 'rgba(255, 255, 255, 1)',
                      }}
                    >
                      {tt('HẠNG MỤC', 'CATEGORY')}
                    </h3>
                    {/* Title 2 */}
                    <h2
                      className="text-2xl sm:text-3xl md:text-4xl leading-tight md:leading-[48px]"
                      style={{
                        fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                        fontWeight: 900,
                        fontStyle: 'normal',
                        letterSpacing: '0%',
                        textAlign: 'center',
                        verticalAlign: 'middle',
                        textTransform: 'uppercase',
                        background: 'linear-gradient(90deg, #E1C693 0%, #FFFFFF 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                    >
                      {category.name}
                    </h2>
                  </div>

                  {/* Grid Layout - 2 columns on desktop, 1 column on mobile */}
                  <div
                    className="flex flex-col mt-6 p-4 md:p-10"
                    style={{
                      background: 'linear-gradient(165.61deg, rgb(50, 50, 50) -4.98%, rgb(0, 0, 0) 107.54%)',
                      borderRadius: '8px',
                    }}
                  >
                    {category.nominees && category.nominees.length > 0 ? (
                      <Grid container spacing={3}>
                      {category.nominees.map((nominee, nomineeIndex) => (
                        <Grid item xs={12} md={6} key={nominee.id}>
                          <div
                            className="flex flex-row w-full p-4 gap-4"
                            style={{
                              position: 'relative',
                              overflow: 'hidden',
                              backgroundColor: nomineeIndex === 0 ? 'transparent' : '#000000',
                              backgroundImage: nomineeIndex === 0
                                ? 'linear-gradient(90deg, #E1C693 0%, #FFFFFF 100%)'
                                : undefined,
                            }}
                          >
                            {/* Gradient Overlay for non-first items */}
                            {nomineeIndex !== 0 && (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  background: 'radial-gradient(67.71% 67.71% at 71.95% 54.6%, rgba(225, 198, 147, 0.2) 0%, rgba(225, 198, 147, 0) 100%)',
                                  pointerEvents: 'none',
                                  zIndex: 0,
                                }}
                              />
                            )}
                            {/* Profile Picture - Left Side */}
                            <div
                              className="flex-shrink-0"
                              style={{
                                width: '100px',
                                height: '100px',
                                position: 'relative',
                                overflow: 'hidden',
                                zIndex: 1,
                              }}
                            >
                              <Image
                                src={nominee.imageUrl || soldierBackgroundImage.src}
                                alt={nominee.title}
                                fill
                                style={{
                                  objectFit: 'cover',
                                }}
                              />
                            </div>

                            {/* Content - Right Side */}
                            <div className="flex flex-col flex-1 gap-3" style={{ position: 'relative', zIndex: 1 }}>
                              {/* Player Name */}
                              <h3
                                className="text-sm md:text-lg"
                                style={{
                                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                                  fontWeight: 900,
                                  fontStyle: 'normal',
                                  lineHeight: '1.3',
                                  letterSpacing: '-0.36px',
                                  verticalAlign: 'middle',
                                  textTransform: 'uppercase',
                                  color: nomineeIndex === 0 ? 'rgba(0, 0, 0, 1)' : 'rgba(255, 255, 255, 1)',
                                  margin: 0,
                                }}
                              >
                                {nominee.title}
                              </h3>

                              {/* Description */}
                              <div
                                title={stripHtmlTags(nominee.description)}
                                className="text-xs md:text-sm"
                                style={{
                                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                                  fontWeight: 400,
                                  fontStyle: 'normal',
                                  lineHeight: '1.4',
                                  letterSpacing: '0%',
                                  verticalAlign: 'middle',
                                  color: nomineeIndex === 0 ? 'rgba(0, 0, 0, 1)' : 'rgba(255, 255, 255, 1)',
                                  textAlign: 'left',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 3,
                                  WebkitBoxOrient: 'vertical' as const,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                                dangerouslySetInnerHTML={{ __html: nominee.description }}
                              />

                              {/* Separator Line */}
                              <div
                                style={{
                                  width: '100%',
                                  height: '1px',
                                  background: nomineeIndex === 0
                                    ? 'linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) 50%, rgba(0, 0, 0, 0) 100%)'
                                    : 'linear-gradient(90deg, rgba(225, 198, 147, 0) 0%, #E1C693 50%, rgba(225, 198, 147, 0) 100%)',
                                  marginTop: '4px',
                                  marginBottom: '4px',
                                }}
                              />

                              {/* Vote Button and Count */}
                              {category.allowVoting && (
                                <div className="flex flex-row items-center gap-3">
                                  <div
                                    style={{
                                      background: 'linear-gradient(303.62deg, #000000 -52.52%, #5A5A5A 177.26%)',
                                      borderRadius: '9999px',
                                      padding: '1px',
                                    }}
                                  >
                                    <button
                                      onClick={() =>
                                        handleVoteClick(
                                          nominee.socialIframe,
                                          nominee.socialUrl,
                                          nominee.voteCount || 0,
                                          category,
                                          { title: nominee.title, updatedAt: nominee.updatedAt }
                                        )
                                      }
                                      className="flex flex-row justify-center items-center cursor-pointer"
                                      style={{
                                        padding: '12px',
                                        gap: '8px',
                                        background: 'rgba(0, 0, 0, 1)',
                                        borderRadius: '9999px',
                                        border: 'none',
                                      }}
                                    >
                                      <Image src={heartIcon} alt="Heart" width={20} height={20} />
                                      <span
                                        style={{
                                          fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                                          fontWeight: 600,
                                          fontStyle: 'normal',
                                          fontSize: '14px',
                                          lineHeight: '14px',
                                          letterSpacing: '0%',
                                          textAlign: 'center',
                                          verticalAlign: 'middle',
                                          color: 'rgba(225, 198, 147, 1)',
                                        }}
                                      >
                                        {tt('Bình chọn', 'Vote')}
                                      </span>
                                    </button>
                                  </div>

                                  {/* Vote Count */}
                                  <div className="flex items-baseline gap-1">
                                    <span
                                      style={{
                                        fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                                        fontWeight: 700,
                                        fontStyle: 'normal',
                                        fontSize: '14px',
                                        lineHeight: '100%',
                                        letterSpacing: '0%',
                                        verticalAlign: 'middle',
                                        color: nomineeIndex === 0 ? 'rgba(0, 0, 0, 1)' : 'rgba(255, 255, 255, 1)',
                                      }}
                                    >
                                      {nominee.voteCount || 0}
                                    </span>
                                    <span
                                      style={{
                                        fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                                        fontWeight: 400,
                                        fontStyle: 'normal',
                                        fontSize: '12px',
                                        lineHeight: '100%',
                                        letterSpacing: '0%',
                                        verticalAlign: 'middle',
                                        color: nomineeIndex === 0 ? 'rgba(0, 0, 0, 1)' : 'rgba(255, 255, 255, 1)',
                                      }}
                                    >
                                      {tt('lượt', 'votes')}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                            {/* Border bottom with gradient */}
                            <div
                              style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: '1px',
                                background: nomineeIndex === 0
                                  ? 'linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) 50%, rgba(0, 0, 0, 0) 100%)'
                                  : 'linear-gradient(90deg, rgba(225, 198, 147, 0) 0%, #E1C693 50%, rgba(225, 198, 147, 0) 100%)',
                                zIndex: 5,
                              }}
                            />
                          </div>
                        </Grid>
                      ))}
                      </Grid>
                    ) : (
                      <div className="text-white text-center">{tt('Chưa có ứng viên nào', 'No nominees yet')}</div>
                    )}
                  </div>
                </div>
              </Container>
            </div>

            {/* Honored Categories Info Section - Insert between category id 6 and 7 */}
            {category.id === 5 && (
              <div className="relative w-full">
                {/* Hidden image to maintain aspect ratio */}
                <Image
                  src={battlegroundsImage}
                  alt=""
                  width={1920}
                  height={1080}
                  className="w-full h-auto opacity-0 pointer-events-none"
                  style={{ display: 'block' }}
                  aria-hidden="true"
                />
                {/* Background image overlay */}
                <div
                  className="absolute inset-0 w-full"
                  style={{
                    backgroundImage: `url(${battlegroundsImage.src})`,
                    backgroundSize: '100% 100%',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                  }}
                >
                  <div
                    className="absolute inset-0 z-10 w-full flex items-center justify-center"
                    style={{ padding: '12px 16px' }}
                  >
                    <Container maxWidth="xl" className="w-full">
                      <div className="flex flex-col items-center justify-center gap-4 md:gap-8 w-full">
                        {/* Title 1: Hạng mục Vinh danh */}
                        <h2
                          className="text-2xl md:text-4xl md:leading-[48px]"
                          style={
                            {
                              fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                              fontStyle: 'normal',
                              fontWeight: 900,
                              lineHeight: '32px',
                              letterSpacing: '0%',
                              textAlign: 'center',
                              verticalAlign: 'middle',
                              textTransform: 'uppercase',
                              background: 'linear-gradient(90deg, #E1C693 0%, #FFFFFF 100%)',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              backgroundClip: 'text',
                              margin: 0,
                            } as React.CSSProperties
                          }
                        >
                          {tt('Hạng mục Vinh danh', 'Honored Categories')}
                        </h2>

                        {/* Title 2: Do ban tổ chức bình chọn */}
                        <p
                          className="text-sm md:text-3xl"
                          style={{
                            fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                            fontStyle: 'normal',
                            fontWeight: 500,
                            lineHeight: '120%',
                            letterSpacing: '0%',
                            textAlign: 'center',
                            verticalAlign: 'middle',
                            textTransform: 'uppercase',
                            color: 'rgba(255, 255, 255, 1)',
                            margin: 0,
                          }}
                        >
                          {tt('Do ban tổ chức bình chọn', 'Organized by the organizing committee')}
                        </p>
                      </div>
                    </Container>
                  </div>
                </div>
              </div>
            )}
          </React.Fragment>
        ))}

      {/* Facebook Vote Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        scroll="body"
        PaperProps={{
          sx: {
            width: { xs: '97%', md: '600px' },
            minWidth: '360px',
            overflow: 'visible',
            margin: '32px 12px',
            '@media (max-width: 663.95px)': {
              maxWidth: '100% !important',
            },
            
          },
        }}
      >

        <Box
          sx={{
            position: 'relative',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundImage: `url(${chickenWinnerImage.src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'repeat',
            overflow: 'visible',
          }}
        >
          {/* Gradient Border Top */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '1px',
              background: 'linear-gradient(90deg, rgba(225, 198, 147, 0) 0%, #E1C693 50%, rgba(225, 198, 147, 0) 100%)',
              zIndex: 5,
            }}
          />
          {/* Close Button */}
          <IconButton
            onClick={handleCloseDialog}
            sx={{
              position: 'absolute',
              top: -14,
              right: -14,
              zIndex: 1301,
              bgcolor: 'rgba(0, 0, 0, 0.7)',
              color: '#E1C693',
              border: '1px solid rgba(225, 198, 147, 0.3)',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.9)',
                border: '1px solid rgba(225, 198, 147, 0.5)',
              },
            }}
            aria-label={tt('Đóng', 'Close')}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M15 5L5 15M5 5L15 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </IconButton>

          {/* Part 1: Header */}
          <Box
            sx={{
              padding: { xs: '16px', md: '20px' },
            }}
          >
            <Stack direction="column" spacing={2}>
              {selectedCategory && (
                <p
                  className="text-xs md:text-base"
                  style={{
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                    fontStyle: 'normal',
                    fontWeight: 500,
                    lineHeight: '120%',
                    letterSpacing: '0%',
                    textAlign: 'center',
                    verticalAlign: 'middle',
                    textTransform: 'uppercase',
                    color: 'rgba(255, 255, 255, 1)',
                    margin: 0,
                  }}
                >
                  {tt('Hạng mục', 'Voting Category')} {selectedCategory.name}
                </p>
              )}
              {selectedNominee?.title && (
                <Typography
                  sx={{
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                    fontStyle: 'normal',
                    fontWeight: 900,
                    fontSize: { xs: '18px', md: '28px' },
                    letterSpacing: '0%',
                    textAlign: 'center',
                    verticalAlign: 'middle',
                    textTransform: 'uppercase',
                    background: 'linear-gradient(90deg, #E1C693 0%, #FFFFFF 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {selectedNominee.title}
                </Typography>
              )}

              {/* <Typography
                sx={{
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                  fontWeight: 400,
                  fontSize: { xs: '13px', md: '14px' },
                  color: '#E1C693',
                  lineHeight: 1.5,
                }}
              >
                {tt(
                  'Nhấn Like bài đăng để bình chọn',
                  'Like the post to complete the voting process.'
                )}
              </Typography> */}
            </Stack>
          </Box>

          {/* Part 3: Body Facebook Post */}
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Stack direction="column" spacing={2}>
              {(selectedSocialIframe || selectedSocialUrl) && (
                  <FBPost
                    socialIframe={selectedSocialIframe}
                    socialUrl={selectedSocialUrl}
                    preferXfbml={isMobile}
                    width={350}
                  />
              )}
              <Typography
                sx={{
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                  fontWeight: 400,
                  fontSize: { xs: '13px', md: '14px' },
                  color: '#E1C693',
                  lineHeight: 1.5,
                  display: 'flex',
                  textAlign: 'left',
                  paddingLeft: '16px',
                  alignItems: 'center',
                  animation: 'bounce-up-down 1.5s ease-in-out infinite',

                }}
              >
                <CaretDoubleUp size={'1.2rem'} />
                &nbsp; {tt('Nhấn Like bài đăng để bình chọn', 'Like the post to complete the voting process.')}
              </Typography>

            </Stack>

          </Box>

          {/* Part 4: Footer Button and Vote Count */}
          <Box
            sx={{
              padding: { xs: '24px 16px', md: '24px 20px' },
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            {/* Vote Count */}
            {selectedSocialIframe && (
              <div className="flex items-baseline gap-1">
                <span
                  style={{
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                    fontWeight: 700,
                    fontStyle: 'normal',
                    fontSize: '20px',
                    lineHeight: '100%',
                    letterSpacing: '0%',
                    verticalAlign: 'middle',
                    color: '#E1C693',
                  }}
                >
                  {selectedVoteCount || 0}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                    fontWeight: 400,
                    fontStyle: 'normal',
                    fontSize: '14px',
                    lineHeight: '100%',
                    letterSpacing: '0%',
                    verticalAlign: 'middle',
                    color: '#E1C693',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {tt('bình chọn', 'votes')}
                  <Tooltip
                    arrow
                    title={tt(
                      `Số lượt bình chọn là tổng số lượt reactions của bài đăng, được cập nhật mỗi 5 phút, cập nhật lần cuối lúc: ${selectedNominee?.updatedAt
                        ? dayjs(selectedNominee.updatedAt).format('HH:mm:ss DD/MM/YYYY')
                        : '—'
                      }`,
                      `Votes = total reactions, updated every 5 minutes, last updated at: ${selectedNominee?.updatedAt
                        ? dayjs(selectedNominee.updatedAt).format('HH:mm:ss DD/MM/YYYY')
                        : '—'
                      }`
                    )}
                  >
                    <span
                      role="button"
                      tabIndex={0}
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 9999,
                        border: '1px solid #E1C693',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 700,
                        lineHeight: '16px',
                        cursor: 'help',
                        userSelect: 'none',
                      }}
                    >
                      i
                    </span>
                  </Tooltip>
                </span>
              </div>
            )}



            {/* Button */}
            {selectedSocialUrl && (
              <a
                href={selectedSocialUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  textDecoration: 'none',
                  flex: 'none',
                  zIndex: 1,
                  cursor: 'pointer',
                  transition: 'opacity 0.2s ease',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                <div className="w-32 sm:w-40 md:w-[180px] h-10 sm:h-12 md:h-[50px]" style={{ position: 'relative' }}>
                  <Image src={buttonBackgroundImage} alt={tt('Bình chọn ngay', 'Vote now')} fill priority />
                  {/* Text overlay */}
                  <span
                    className="text-xs sm:text-sm md:text-base"
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                      fontStyle: 'normal',
                      fontWeight: 900,
                      lineHeight: '1.2',
                      textAlign: 'center',
                      textTransform: 'uppercase',
                      color: '#121026',
                      zIndex: 2,
                      pointerEvents: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {tt('Bình chọn ngay', 'Vote now')}
                  </span>
                </div>
              </a>
            )}
          </Box>
          {/* Gradient Border Bottom */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '1px',
              background: 'linear-gradient(90deg, rgba(225, 198, 147, 0) 0%, #E1C693 50%, rgba(225, 198, 147, 0) 100%)',
              zIndex: 5,
            }}
          />
        </Box>
      </Dialog>

      {/* Footer */}
      <PubgGalaFooter />
    </div>
  );
}
