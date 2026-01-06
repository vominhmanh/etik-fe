'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import battlegroundsImageLong  from '@/images/pubg/background-battleground-long-light.png';
import battlegroundsImage from '@/images/pubg/battlegrounds.png';
import blackButtonBgImage from '@/images/pubg/black-button-bg.png';
import buttonBackgroundImage from '@/images/pubg/button-background.png';
import cardBackgroundImage from '@/images/pubg/card-background.png';
import chickenWinnerImage from '@/images/pubg/chicken-winner.png';
import heartIcon from '@/images/pubg/heart.svg';
import backgroundImage from '@/images/pubg/KV_PUBG_GALA_16x9.jpg';
import soldierBackgroundImage from '@/images/pubg/soldier-background.png';
import votingService from '@/services/Voting.service';
import { Box, Container, Dialog, Grid, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import type { Swiper as SwiperType } from 'swiper';
import { Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import Link from 'next/link';
import 'swiper/css';
import 'swiper/css/navigation';

dayjs.extend(utc);
dayjs.extend(timezone);

import { Category } from '@/types/voting';
import { useTranslation } from '@/contexts/locale-context';
import { LocalizedLink } from '@/components/pubggala/localized-link';
import PubgGalaPageHeader from '@/components/pubggala/ui/pubggala-page-header';
import PubgGalaFooter from '@/components/pubggala/ui/pubggala-footer';
import FlipClockCountdown from '@leenguyen/react-flip-clock-countdown';
import '@leenguyen/react-flip-clock-countdown/dist/index.css';
import dynamic from 'next/dynamic';
import { CaretDoubleUp } from '@phosphor-icons/react/dist/ssr';

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
  const [selectedNomineeIndex, setSelectedNomineeIndex] = useState<number>(-1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const swiperRefs = useRef<{ [key: number]: SwiperType | null }>({});
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isSmallMobile, setIsSmallMobile] = useState(false);

  // Check if current time is after 12:00 PM on 15/01/2026 UTC+7
  const isVotingDisabled = () => {
    const cutoffDate = dayjs.tz('2026-01-15 12:00:00', 'Asia/Ho_Chi_Minh');
    const now = dayjs.tz(dayjs(), 'Asia/Ho_Chi_Minh');
    // return now.isAfter(cutoffDate);
    return true;
  };

  // Format number with dot as thousands separator (1.234.567)
  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Check if countdown time has passed (2026-01-17T16:00:00 UTC+7)
  const isCountdownPassed = useMemo(() => {
    const countdownDate = dayjs.tz('2026-01-17 16:00:00', 'Asia/Ho_Chi_Minh');
    const now = dayjs.tz(dayjs(), 'Asia/Ho_Chi_Minh');
    // return now.isAfter(countdownDate);
    return true;
  }, []);

  // Detect screen size for responsive flip clock
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsSmallMobile(window.innerWidth <= 480);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Flip clock responsive config
  const getFlipClockConfig = () => {
    if (isSmallMobile) {
      return {
        digitBlock: { width: 28, height: 40, fontSize: 18 },
        label: { fontSize: 8 },
      };
    }
    if (isMobile) {
      return {
        digitBlock: { width: 32, height: 45, fontSize: 20 },
        label: { fontSize: 9 },
      };
    }
    return {
      digitBlock: { width: 50, height: 70, fontSize: 36 },
      label: { fontSize: 12 },
    };
  };

  const flipClockConfig = getFlipClockConfig();

  // Shuffle array function (Fisher-Yates algorithm)
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await votingService.getAllInfo(51);
        if (response.data?.categories) {
          // Shuffle nominees for each category
          const categoriesWithShuffledNominees = response.data.categories.map(category => ({
            ...category,
            nominees: shuffleArray(category.nominees || [])
          }));
          setCategories(categoriesWithShuffledNominees);
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
    if (socialIframe && category) {
      setSelectedSocialIframe(socialIframe);
      setSelectedSocialUrl(socialUrl || '');
      setSelectedVoteCount(voteCount);
      setSelectedCategory(category);
      setSelectedNominee(nominee || null);

      // Find index of selected nominee
      const nomineeIndex = category.nominees.findIndex(
        (n) => n.title === nominee?.title
      );
      setSelectedNomineeIndex(nomineeIndex >= 0 ? nomineeIndex : -1);

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
    setSelectedNomineeIndex(-1);
  };

  // Navigate to next/previous nominee
  const navigateNominee = (direction: 'next' | 'prev') => {
    if (!selectedCategory || selectedNomineeIndex < 0 || isTransitioning) return;

    const nominees = selectedCategory.nominees;
    if (nominees.length === 0) return;

    setIsTransitioning(true);

    let newIndex = direction === 'next'
      ? selectedNomineeIndex + 1
      : selectedNomineeIndex - 1;

    // Wrap around
    if (newIndex < 0) newIndex = nominees.length - 1;
    if (newIndex >= nominees.length) newIndex = 0;

    const nominee = nominees[newIndex];
    if (nominee) {
      // Small delay for fade effect
      setTimeout(() => {
        setSelectedSocialIframe(nominee.socialIframe);
        setSelectedSocialUrl(nominee.socialUrl || '');
        setSelectedVoteCount(nominee.voteCount || 0);
        setSelectedNominee({ title: nominee.title, updatedAt: nominee.updatedAt });
        setSelectedNomineeIndex(newIndex);

        // Reset transition after content updates
        setTimeout(() => {
          setIsTransitioning(false);
        }, 50);
      }, 150);
    } else {
      setIsTransitioning(false);
    }
  };

  // Handle swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    // Minimum swipe distance (50px)
    const minSwipeDistance = 50;

    // Check if horizontal swipe is greater than vertical swipe
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        // Swipe right - go to previous
        navigateNominee('prev');
      } else {
        // Swipe left - go to next
        navigateNominee('next');
      }
    }

    touchStartRef.current = null;
  };

  return (
    <div className="relative w-full">
      {/* Load Facebook SDK only on mobile (XFBML mode) */}
      {isMobile && <FacebookSDK />}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes gradient-shift {
            0% {
              background-position: 0% 50%;
            }
            100% {
              background-position: 200% 50%;
            }
          }
          .animated-gradient-text {
            background: linear-gradient(
              90deg,
              #E1C693 0%,
              #FFFFFF 25%,
              #E1C693 50%,
              #FFFFFF 75%,
              #E1C693 100%
            );
            background-size: 200% 100%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: gradient-shift 4s ease-in-out infinite;
          }
          @keyframes bounce-up-down {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-8px);
            }
          }
        `
      }} />
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
                  {tt('PUBG GALA 2025', 'PUBG GALA 2025')}
                </h3>
              </div>

              <h1
                className="text-3xl sm:text-5xl md:text-6xl lg:text-[72px] leading-tight md:leading-[76px] animated-gradient-text"
                style={
                  {
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                    fontStyle: 'normal',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    textTransform: 'uppercase',
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
                    'Join us in voting and honoring the individuals, teams, and memorable moments of PUBG Vietnam in 2025.'
                  )
                    .replace(/\n\n/g, '<br /><br />')
                    .replace(/\n/g, '<br />'),
                }}
              />

              {/* Button */}
              {!isVotingDisabled() && (
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
                  <Link
                    href="#award-categories-list"
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
                  </Link>
                </div>
              )}
            </div>
          </Container>
        </div>
      </div>


      {/* Voting Categories Info Section */}
      <div
        className="relative w-full"
        style={{
          backgroundImage: `url(${battlegroundsImageLong.src})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="relative z-10 w-full flex items-center justify-center py-8 md:py-12">
          <Container maxWidth="xl" className="w-full">
            <div className="flex flex-col items-center justify-center gap-2 md:gap-8 w-full">
              <Stack spacing={1}>

                <h2
                  className="text-xl md:text-3xl md:leading-[48px]"
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
                  {tt('16:00 | 17 / 01 / 2026', '16 : 00 | 17 / 01 / 2026')}
                </h2>

                {/* Title 2: kết quả dựa trên 70% bình chọn từ cộng đồng & 30% đánh giá từ ban tổ chức */}
                <p
                  className="text-sm md:text-2xl"
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
                    'Ariyana Convention Centre - TP. Đà Nẵng',
                    'Ariyana Convention Centre - TP. Đà Nẵng'
                  )}
                </p>
              </Stack>
              {!isCountdownPassed && (
                <div className="flex justify-center items-center w-full">
                  <FlipClockCountdown
                    to={new Date('2026-01-17T16:00:00').getTime()}
                    labels={['NGÀY', 'GIỜ', 'PHÚT', 'GIÂY']}
                    labelStyle={{
                      fontSize: flipClockConfig.label.fontSize,
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      color: '#E1C693',
                      fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                      letterSpacing: '1px',
                    }}
                    digitBlockStyle={{
                      width: flipClockConfig.digitBlock.width,
                      height: flipClockConfig.digitBlock.height,
                      fontSize: flipClockConfig.digitBlock.fontSize,
                      fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                      fontWeight: 900,
                      color: '#E1C693',
                      borderRadius: 8,
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(225, 198, 147, 0.1)',
                    }}
                    dividerStyle={{
                      color: 'rgba(225, 198, 147, 0.3)',
                      height: 1,
                    }}
                    separatorStyle={{
                      color: '#E1C693',
                      size: isMobile ? '6px' : '8px',
                    }}
                    duration={0.5}
                    className="flip-clock"
                  />
                </div>
              )}

            </div>
          </Container>
        </div>
        {/* Border bottom with gradient */}
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
      </div>
      {/* Body2: Message Section */}
      {isCountdownPassed && (
        <div className="relative w-full bg-black py-8 md:py-16">
          <Container maxWidth="xl">
            <div className="flex flex-col gap-12" data-aos="fade-left">
              {/* Title */}
              <h2
                className="text-2xl sm:text-3xl md:text-4xl leading-tight md:leading-[48px]"
                style={{
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                  fontWeight: 900,
                  fontStyle: 'normal',
                  letterSpacing: '0%',
                  verticalAlign: 'middle',
                  textTransform: 'uppercase',
                  background: 'linear-gradient(90deg, #E1C693 0%, #FFFFFF 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  textAlign: isMobile ? 'center' : 'left',
                }}
              >
                {tt('🏆 WINNER WINNER CHICKEN DINNER!', '🏆 WINNER WINNER CHICKEN DINNER!')}
              </h2>

              {/* Content: Video left, Text right */}
              <Grid container spacing={8}>
                {/* Video */}
                <Grid item xs={12} md={5}>
                  <div className="relative w-full" style={{ paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
                    <iframe
                      src="https://www.youtube-nocookie.com/embed/GgDDVrx8njg?si=y1vCTug2EF31pgVk"
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                      className="absolute top-0 left-0 w-full h-full"
                    />
                  </div>
                </Grid>

                {/* Text Content */}
                <Grid item xs={12} md={7}>
                  <div className="flex flex-col gap-4 md:gap-6">
                    {/* Paragraph 1 - Font Weight 900 */}
                    <div
                      className="text-sm sm:text-base md:text-lg leading-relaxed"
                      style={{
                        width: '100%',
                        height: 'auto',
                        fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                        fontStyle: 'normal',
                        fontWeight: 900,
                        color: '#FFFFFF',
                      }}
                    >
                      {tt(
                        '🏆 KHOẢNH KHẮC VINH QUANG ĐÃ ĐIỂM!',
                        '🏆 THE MOMENT OF GLORY HAS ARRIVED!'
                      )}
                    </div>
                    {/* Paragraph 2 - Font Weight Normal */}
                    <div
                      className="text-sm sm:text-base md:text-lg leading-relaxed"
                      style={{
                        width: '100%',
                        height: 'auto',
                        fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                        fontStyle: 'normal',
                        fontWeight: 400,
                        color: '#FFFFFF',
                        textAlign: 'justify',
                      }}
                    >
                      {tt(
                        'Lần đầu tiên, hành trình rực lửa của cộng đồng PUBG Việt Nam được tái hiện trọn vẹn tại PUBG Gala 2025 – Gala of Glory. Không chỉ là một lễ trao giải, đây là nơi tôn vinh những giọt mồ hôi, sự đoàn kết và đam mê cháy bỏng đã kiến tạo nên một năm 2025 đầy tự hào. Cùng nhìn lại những cột mốc vàng son và tri ân những "chiến binh" đã cống hiến hết mình cho nền Esports nước nhà.',
                        'For the first time, the blazing journey of the PUBG Vietnam community is fully recreated at PUBG Gala 2025 – Gala of Glory. More than just an awards ceremony, this is a place to honor the sweat, unity, and burning passion that created a proud 2025. Together, let\'s look back at the golden milestones and pay tribute to the "warriors" who have dedicated themselves to the country\'s Esports scene.'
                      )}
                    </div>
                    {/* Paragraph 3 - Font Weight Normal */}
                    <div
                      className="text-sm sm:text-base md:text-lg leading-relaxed"
                      style={{
                        width: '100%',
                        height: 'auto',
                        fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                        fontStyle: 'normal',
                        fontWeight: 400,
                        color: '#FFFFFF',
                        textAlign: 'justify',
                      }}
                    >
                      {tt(
                        '🔥 Đừng bỏ lỡ giây phút lịch sử này! Cùng theo dõi livestream và hòa mình vào không khí vinh quang!',
                        '🔥 Don\'t miss this historic moment! Join us in the atmosphere of glory!'
                      )}
                    </div>
                  </div>
                </Grid>
              </Grid>
            </div>
          </Container>
        </div>
      )}


      <div
        id="award-categories-list"
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
                    {!isVotingDisabled() && (
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
                    )}
                  </div>
                ))}
              </div>
              {/* Vote Button - Mobile only */}
              <Stack direction="column" spacing={2} className="sm:px-4 mt-4">
                {!isVotingDisabled() && (
                  <div className="block md:hidden relative w-full sm:w-auto flex-shrink-0">
                    <button
                      onClick={() => scrollToCategory(0)}
                      className="w-full sm:w-[240px] h-[50px] sm:h-[55px] cursor-pointer"
                      style={{ position: 'relative', background: 'none', border: 'none', padding: 0 }}
                    >
                      <Image src={blackButtonBgImage} alt={tt('Bình chọn', 'Vote')} fill style={{ objectFit: 'contain' }} />
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
                )}
                {/* Title 2: kết quả dựa trên 70% bình chọn từ cộng đồng & 30% đánh giá từ ban tổ chức */}
                <p
                  className="text-xs md:text-lg md:mt-4"
                  style={{
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                    fontStyle: 'normal',
                    fontWeight: 900,
                    lineHeight: '120%',
                    letterSpacing: '20%',
                    textAlign: 'center',
                    verticalAlign: 'middle',
                    textTransform: 'uppercase',
                    color: 'rgba(255, 255, 255, 1)',
                    margin: 0,
                  }}
                >
                  {tt(
                    'Hạn cuối bình chọn: 12:00:00 15/01/2026',
                    'End of voting: 12:00:00 15/01/2026'
                  )}
                </p>
              </Stack>
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
            backgroundImage: `url(${battlegroundsImageLong.src})`,
            backgroundSize: 'auto 100%',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          <div className="absolute inset-0 z-10 w-full flex items-center justify-center py-4">
            <Container maxWidth="xl" className="w-full">
              <div className="flex flex-col items-center justify-center gap-2 md:gap-8 w-full">
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

                  {/* Grid Layout - 3 items per row on desktop, horizontal scroll on mobile */}
                  {category.nominees && category.nominees.length > 0 ? (
                    <div className="relative">
                      {/* Mobile: Horizontal scroll container with arrows */}
                      <div className="md:hidden relative">
                        {/* Left Arrow */}
                        <button
                          onClick={() => {
                            const swiper = swiperRefs.current[category.id];
                            if (swiper) {
                              swiper.slidePrev();
                            }
                          }}
                          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 rounded-full p-2 flex items-center justify-center transition-all"
                          style={{
                            width: '40px',
                            height: '40px',
                            border: '1px solid rgba(225, 198, 147, 0.5)',
                          }}
                          aria-label="Scroll left"
                        >
                          <span style={{ color: '#E1C693', fontSize: '20px', fontWeight: 'bold' }}>‹</span>
                        </button>

                        {/* Right Arrow */}
                        <button
                          onClick={() => {
                            const swiper = swiperRefs.current[category.id];
                            if (swiper) {
                              swiper.slideNext();
                            }
                          }}
                          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 rounded-full p-2 flex items-center justify-center transition-all"
                          style={{
                            width: '40px',
                            height: '40px',
                            border: '1px solid rgba(225, 198, 147, 0.5)',
                          }}
                          aria-label="Scroll right"
                        >
                          <span style={{ color: '#E1C693', fontSize: '20px', fontWeight: 'bold' }}>›</span>
                        </button>

                        <Swiper
                          onSwiper={(swiper) => {
                            swiperRefs.current[category.id] = swiper;
                          }}
                          modules={[Navigation]}
                          slidesPerView="auto"
                          spaceBetween={16}
                          centeredSlides={true}
                          className="!pb-4"
                          style={{
                            paddingLeft: '7.5vw',
                            paddingRight: '7.5vw',
                          }}
                        >
                          {category.nominees.map((nominee) => (
                            <SwiperSlide
                              key={nominee.id}
                              style={{
                                width: '85vw',
                                maxWidth: '400px',
                              }}
                            >
                              <div
                                className="flex flex-col bg-black w-full"
                                style={{
                                  position: 'relative',
                                  overflow: 'hidden',
                                  aspectRatio: '1 / 1',
                                }}
                              >
                                {/* Border bottom with gradient */}
                                <div
                                  style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    height: '1px',
                                    background:
                                      'linear-gradient(90deg, rgba(225, 198, 147, 0) 0%, #E1C693 50%, rgba(225, 198, 147, 0) 100%)',
                                    zIndex: 5,
                                  }}
                                />
                                {/* Background Image */}
                                <div
                                  className="absolute inset-0"
                                  style={{
                                    backgroundImage: nominee.imageUrl
                                      ? `url(${nominee.imageUrl})`
                                      : `url(${soldierBackgroundImage.src})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    backgroundRepeat: 'no-repeat',
                                    opacity: category.allowVoting && isVotingDisabled() ? 0.33 : 1,
                                    zIndex: 0,
                                    width: '100%',
                                    height: '100%',
                                  }}
                                />

                                {/* Fade Background Overlay */}
                                <div
                                  className="absolute"
                                  style={{
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    width: '100%',
                                    height: '30%',
                                    background: 'linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.3) 50%, rgba(0, 0, 0, 0) 100%)',
                                    pointerEvents: 'none',
                                    zIndex: 1,
                                  }}
                                />

                                {/* Card Content */}
                                <div className="relative z-10 flex flex-col h-full p-4 justify-between">
                                  {/* Card Title - Top */}
                                  {/* <h3
                                    style={{
                                      fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                                      fontWeight: 900,
                                      fontStyle: 'normal',
                                      fontSize: '18px',
                                      lineHeight: '23.4px',
                                      letterSpacing: '-0.36px',
                                      verticalAlign: 'middle',
                                      textTransform: 'uppercase',
                                      color: 'rgba(255, 255, 255, 1)',
                                    }}
                                  >
                                    {nominee.title}
                                  </h3> */}

                                  {/* Spacer to push content to bottom */}
                                  <div style={{ flex: 1 }} />

                                  {/* Card Content - Bottom */}
                                  <div className="flex flex-col gap-3">
                                    {category.allowVoting && isVotingDisabled() &&
                                      <div
                                        style={{
                                          fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                                          fontWeight: 400,
                                          fontStyle: 'normal',
                                          fontSize: '14px',
                                          lineHeight: '1.4',
                                          letterSpacing: '0%',
                                          verticalAlign: 'middle',
                                          color: 'rgba(244, 245, 248, 1)',
                                          textAlign: 'left',
                                          display: '-webkit-box',
                                          WebkitLineClamp: 3,
                                          WebkitBoxOrient: 'vertical' as const,
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                        }}
                                      >
                                        <p style={{ fontWeight: 700 }}>HẾT THỜI GIAN BÌNH CHỌN</p>
                                        <p style={{ fontWeight: 400 }}>Đón xem kết quả tại livestream PUBG Gala vào 16h 17/01.</p>
                                      </div>
                                    }

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
                                              !isVotingDisabled() &&
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
                                              {isVotingDisabled() ? formatNumber(nominee.voteCount || 0) + ' lượt' : tt('Bình chọn', 'Vote')}
                                            </span>
                                          </button>
                                        </div>

                                        {/* Vote Count */}
                                        {!isVotingDisabled() && (
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
                                                color: 'rgba(255, 255, 255, 1)',
                                              }}
                                            >
                                              {formatNumber(nominee.voteCount || 0)}
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
                                                color: 'rgba(255, 255, 255, 1)',
                                              }}
                                            >
                                              {tt('lượt', 'votes')}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </SwiperSlide>
                          ))}
                        </Swiper>
                      </div>

                      {/* Desktop: Grid Layout */}
                      <div className="hidden md:block">
                        <Grid container spacing={2} justifyContent="center">
                          {category.nominees.map((nominee) => (
                            <Grid item xs={12} md={3} lg={3} key={nominee.id}>
                              <div
                                className="flex flex-col bg-black w-full"
                                style={{
                                  position: 'relative',
                                  overflow: 'hidden',
                                  aspectRatio: '1 / 1',
                                }}
                              >
                                {/* Border bottom with gradient */}
                                <div
                                  style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    height: '1px',
                                    background:
                                      'linear-gradient(90deg, rgba(225, 198, 147, 0) 0%, #E1C693 50%, rgba(225, 198, 147, 0) 100%)',
                                    zIndex: 5,
                                  }}
                                />
                                {/* Background Image */}
                                <div
                                  className="absolute inset-0"
                                  style={{
                                    backgroundImage: nominee.imageUrl
                                      ? `url(${nominee.imageUrl})`
                                      : `url(${soldierBackgroundImage.src})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    backgroundRepeat: 'no-repeat',
                                    opacity: category.allowVoting && isVotingDisabled() ? 0.33 : 1,
                                    zIndex: 0,
                                    width: '100%',
                                    height: '100%',
                                  }}
                                />

                                {/* Fade Background Overlay */}
                                <div
                                  className="absolute"
                                  style={{
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    width: '100%',
                                    height: '20%',
                                    background: 'linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.3) 50%, rgba(0, 0, 0, 0) 100%)',
                                    pointerEvents: 'none',
                                    zIndex: 1,
                                  }}
                                />

                                {/* Card Content */}
                                <div className="relative z-10 flex flex-col h-full p-4 justify-between">
                                  {/* Card Title - Top */}
                                  {/* <h3
                                    style={{
                                      fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                                      fontWeight: 900,
                                      fontStyle: 'normal',
                                      fontSize: '18px',
                                      lineHeight: '23.4px',
                                      letterSpacing: '-0.36px',
                                      verticalAlign: 'middle',
                                      textTransform: 'uppercase',
                                      color: 'rgba(255, 255, 255, 1)',
                                    }}
                                  >
                                    {nominee.title}
                                  </h3> */}

                                  {/* Spacer to push content to bottom */}
                                  <div style={{ flex: 1 }} />

                                  {/* Card Content - Bottom */}
                                  <div className="flex flex-col gap-3">
                                    {category.allowVoting && isVotingDisabled() && (
                                      <div
                                        style={{
                                          fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                                          fontWeight: 400,
                                          fontStyle: 'normal',
                                          fontSize: '14px',
                                          lineHeight: '1.4',
                                          letterSpacing: '0%',
                                          verticalAlign: 'middle',
                                          color: 'rgba(244, 245, 248, 1)',
                                          textAlign: 'left',
                                          display: '-webkit-box',
                                          WebkitLineClamp: 3,
                                          WebkitBoxOrient: 'vertical' as const,
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                        }}
                                      >
                                        <p style={{ fontWeight: 700 }}>HẾT THỜI GIAN BÌNH CHỌN</p>
                                        <p style={{ fontWeight: 400 }}>Đón xem kết quả tại livestream PUBG Gala vào 16h 17/01.</p>

                                      </div>)}

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
                                              !isVotingDisabled() &&
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
                                              {isVotingDisabled() ? formatNumber(nominee.voteCount || 0) + ' lượt' : tt('Bình chọn', 'Vote')}
                                            </span>
                                          </button>
                                        </div>

                                        {/* Vote Count */}
                                        {!isVotingDisabled() && (
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
                                                color: 'rgba(255, 255, 255, 1)',
                                              }}
                                            >
                                              {formatNumber(nominee.voteCount || 0)}
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
                                                color: 'rgba(255, 255, 255, 1)',
                                              }}
                                            >
                                              {tt('lượt', 'votes')}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </Grid>
                          ))}
                        </Grid>
                      </div>
                    </div>
                  ) : (
                    <div className="text-white text-center">{tt('Chưa có ứng viên nào', 'No nominees yet')}</div>
                  )}

                  {/* Hide scrollbar for mobile and Swiper navigation */}
                  <style jsx>{`
                    div[style*='scrollSnapType']::-webkit-scrollbar {
                      display: none;
                    }
                    .swiper {
                      overflow: visible;
                    }
                    .swiper-wrapper {
                      padding-left: 7.5vw;
                      padding-right: 7.5vw;
                    }
                    .swiper-slide {
                      display: flex;
                      justify-content: center;
                    }
                  `}</style>
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
                    backgroundImage: `url(${battlegroundsImageLong.src})`,
                    backgroundSize: 'auto 100%',
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
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
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
            touchAction: 'pan-y', // Allow vertical scrolling but handle horizontal swipes
            opacity: isTransitioning ? 0.7 : 1,
            transition: 'opacity 0.15s ease-in-out',
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

          {/* Navigation Buttons */}
          {selectedCategory && selectedCategory.nominees.length > 1 && (
            <>
              {/* Previous Button */}
              <IconButton
                onClick={() => navigateNominee('prev')}
                sx={{
                  position: 'absolute',
                  left: -14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 1301,
                  bgcolor: 'rgba(0, 0, 0, 0.7)',
                  color: '#E1C693',
                  border: '1px solid rgba(225, 198, 147, 0.3)',
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.9)',
                    border: '1px solid rgba(225, 198, 147, 0.5)',
                  },
                }}
                aria-label={tt('Trước', 'Previous')}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 15L7 10L12 5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </IconButton>

              {/* Next Button */}
              <IconButton
                onClick={() => navigateNominee('next')}
                sx={{
                  position: 'absolute',
                  right: -14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 1301,
                  bgcolor: 'rgba(0, 0, 0, 0.7)',
                  color: '#E1C693',
                  border: '1px solid rgba(225, 198, 147, 0.3)',
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.9)',
                    border: '1px solid rgba(225, 198, 147, 0.5)',
                  },
                }}
                aria-label={tt('Tiếp', 'Next')}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M8 5L13 10L8 15"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </IconButton>
            </>
          )}

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
                    fontSize: { xs: '24px', md: '36px' },
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
                  {formatNumber(selectedVoteCount || 0)}
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
                    enterDelay={isMobile ? 200 : 0}
                    leaveDelay={isMobile ? 5000 : 0}
                    disableHoverListener={false}
                    disableTouchListener={false}
                    title={tt(
                      `Số lượt bình chọn được tính bằng tổng số cảm xúc (thích, thả tim...) trong bài đăng, được cập nhật mỗi 5 phút, cập nhật lần cuối lúc: ${selectedNominee?.updatedAt
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
