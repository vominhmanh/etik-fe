'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import backgroundGradientImage from '@/images/pubg/background-gradient.png';
import battlegroundsImage from '@/images/pubg/battlegrounds.png';
import blackButtonBgImage from '@/images/pubg/black-button-bg.png';
import buttonBackgroundImage from '@/images/pubg/button-background.png';
import cafefLogo from '@/images/pubg/cafef.png';
import cardBackgroundImage from '@/images/pubg/card-background.png';
import chickenWinnerImage from '@/images/pubg/chicken-winner.png';
import facebookIcon from '@/images/pubg/facebook.svg';
import fcoiceLogo from '@/images/pubg/fcoice-2025.png';
import heartIcon from '@/images/pubg/heart.svg';
import backgroundImage from '@/images/pubg/KV_PUBG_GALA_16x9.jpg';
import soldierBackgroundImage from '@/images/pubg/soldier-background.png';
import tiktokIcon from '@/images/pubg/tiktok.svg';
import vccorpLogo from '@/images/pubg/vccorp.png';
import votingService from '@/services/Voting.service';
import { Box, Button, Container, Dialog, IconButton, Stack, Typography } from '@mui/material';

import { Category } from '@/types/voting';
import { useTranslation } from '@/contexts/locale-context';
import { LocalizedLink } from '@/components/pubggala/localized-link';
import PubgGalaPageHeader from '@/components/pubggala/ui/pubggala-page-header';

export default function Home() {
  const { tt } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSocialIframe, setSelectedSocialIframe] = useState<string>('');
  const [selectedVoteCount, setSelectedVoteCount] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await votingService.getAllInfo(51);
        if (response.data?.categories) {
          setCategories(response.data.categories);
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
  const handleVoteClick = (socialIframe: string, voteCount: number = 0) => {
    if (socialIframe) {
      setSelectedSocialIframe(socialIframe);
      setSelectedVoteCount(voteCount);
      setDialogOpen(true);
    }
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedSocialIframe('');
    setSelectedVoteCount(0);
  };

  return (
    <div className="relative w-full">
      {/* Body1: Background Image with Content */}
      <div className="relative" style={{ width: '100%', height: '800px', backgroundColor: '#000000' }}>
        {/* Background Image with Gradient Overlay */}
        <div className="absolute top-0 left-0 w-full h-full" style={{ paddingTop: '80px' }}>
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
        <div className="absolute inset-0 z-10 flex items-center pt-14">
          <Container maxWidth="lg">
            <div className="flex flex-col gap-6">
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
                {tt(
                  'VINH DANH & BÌNH CHỌN',
                  'HONOR & VOTE'
                )}
               
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
                
                {tt(
                  'PUBG GALA 2025:',
                  'PUBG GALA 2025:'
                )}
              </h3>
             
              </div>
             
              <h1
                className="text-3xl sm:text-5xl md:text-6xl lg:text-[72px] leading-tight md:leading-[76px]"
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
                {tt(
                  'GALA OF GLORY',
                  'GALA OF GLORY'
                )}
              </h1>

              {/* Description */}
              <p
                className="text-sm sm:text-base md:text-lg"
                style={{
                  width: '476px',
                  maxWidth: '100%',
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
              >
                {tt(
                  'Tham gia bình chọn các đề cử Gala of glory 2025 nhằm tôn vinh những sự kiện, nhân vật, chính sách, công ty…nổi bật nhất trong nền kinh tế Việt Nam.',
                  "Participate in voting for the Gala of Glory 2025 nominees to honor the most outstanding events, individuals, policies, companies... in Vietnam's economy."
                )}
              </p>

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
                    <Image
                      src={buttonBackgroundImage}
                      alt={tt('Bình chọn', 'Vote')}
                      fill
                      priority
                    />
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
        className="relative w-full"
        style={{
          position: 'relative',
          isolation: 'isolate',
          background: 'linear-gradient(165.61deg, rgb(50, 50, 50) -4.98%, rgb(0, 0, 0) 107.54%)',
        }}
      >
        <div className="relative z-10 w-full flex items-start" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
          <Container maxWidth="lg">
            <div className="flex flex-col gap-2 md:gap-4">
              {/* Title 1: Những hạng mục vinh danh & bình chọn */}
              <h3
                style={{
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                  fontStyle: 'normal',
                  fontWeight: 500,
                  fontSize: '20px',
                  lineHeight: '24px',
                  letterSpacing: '0%',
                  textAlign: 'left',
                  verticalAlign: 'middle',
                  textTransform: 'uppercase',
                  color: 'rgba(255, 255, 255, 1)',
                  margin: 0,
                }}
              >
                {tt('Những hạng mục vinh danh & bình chọn', 'Honored & Voting Categories')}
              </h3>

              {/* Title 2: pubg gala 2025 : gala of glory */}
              <h2
                style={
                  {
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                    fontStyle: 'normal',
                    fontWeight: 900,
                    fontSize: '36px',
                    lineHeight: '48px',
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
                {tt('pubg gala 2025 : gala of glory', 'PUBG GALA 2025 : GALA OF GLORY')}
              </h2>

              {/* Voting Categories List Section */}
              <div
                className="flex flex-col"
                style={{
                  marginTop: '24px',
                  background: 'linear-gradient(165.61deg, rgb(50, 50, 50) -4.98%, rgb(0, 0, 0) 107.54%)',
                  padding: '24px',
                  borderRadius: '8px',
                }}
              >
                {/* Title: Hạng mục Bình chọn */}
                <h2
                  style={{
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                    fontStyle: 'normal',
                    fontWeight: 900,
                    fontSize: '24px',
                    lineHeight: '24px',
                    letterSpacing: '0%',
                    textAlign: 'left',
                    verticalAlign: 'middle',
                    textTransform: 'uppercase',
                    color: 'rgba(255, 255, 255, 1)',
                    margin: 0,
                    marginBottom: '32px',
                  }}
                >
                  {tt('Hạng mục Bình chọn', 'Voting Categories')}
                </h2>

                {/* List of Categories */}
                <div className="flex flex-col">
                  {[
                    { number: '01', name: 'Tuyển thủ Ấn tượng 2025', nameEn: 'Impresssive Player 2025' },
                    { number: '02', name: 'Đội tuyển Ấn tượng 2025', nameEn: 'Impresssive Team 2025' },
                    { number: '03', name: 'Steamer được yêu thích 2025', nameEn: 'Favorite Streamer 2025' },
                    { number: '04', name: 'Đội ngũ Truyền thông 2025', nameEn: 'Media Team 2025' },
                  ].map((category, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 w-full"
                      style={{
                        borderBottom: index < 3 ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
                        padding: '16px',
                        paddingBottom: index < 3 ? '16px' : '16px',
                        backgroundImage: `url(${cardBackgroundImage.src})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        position: 'relative',
                      }}
                    >
                      {/* Number Box */}
                      <div
                        style={{
                          width: '70px',
                          height: '45px',
                          backgroundColor: 'rgba(225, 198, 147, 1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          paddingLeft: '10px',
                          paddingRight: '10px',
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                            fontStyle: 'normal',
                            fontWeight: 800,
                            fontSize: '36px',
                            lineHeight: '44.28px',
                            letterSpacing: '0%',
                            textAlign: 'center',
                            verticalAlign: 'middle',
                            textTransform: 'uppercase',
                            color: 'rgba(18, 16, 38, 1)',
                          }}
                        >
                          {category.number}
                        </span>
                      </div>

                      {/* Category Name */}
                      <div className="flex-1">
                        <h3
                          style={
                            {
                              fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                              fontStyle: 'normal',
                              fontWeight: 900,
                              fontSize: '28px',
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
                          {tt(category.name, category.nameEn)}
                        </h3>
                      </div>

                      {/* Vote Button */}
                      <div className="relative" style={{ flexShrink: 0, paddingLeft: '16px', paddingRight: '16px' }}>
                        <button
                          onClick={() => scrollToCategory(index)}
                          className="w-[240px] h-[55px] cursor-pointer"
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
              </div>

              {/* Honored Categories List Section */}
              <div
                className="flex flex-col"
                style={{
                  marginTop: '48px',
                  background: 'linear-gradient(165.61deg, rgb(50, 50, 50) -4.98%, rgb(0, 0, 0) 107.54%)',
                  padding: '24px',
                  borderRadius: '8px',
                }}
              >
                {/* Title: Hạng mục Vinh danh */}
                <h2
                  style={{
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                    fontStyle: 'normal',
                    fontWeight: 900,
                    fontSize: '24px',
                    lineHeight: '24px',
                    letterSpacing: '0%',
                    textAlign: 'left',
                    verticalAlign: 'middle',
                    textTransform: 'uppercase',
                    color: 'rgba(255, 255, 255, 1)',
                    margin: 0,
                    marginBottom: '32px',
                  }}
                >
                  {tt('Hạng mục Vinh danh', 'Honored Categories')}
                </h2>

                {/* List of Honored Categories */}
                <div className="flex flex-col">
                  {[
                    { number: '01', name: 'Tuyển thủ Xuất sắc 2025', nameEn: 'Outstanding Player 2025' },
                    { number: '02', name: 'Đội tuyển Xuất sắc 2025', nameEn: 'Outstanding Team 2025' },
                    { number: '03', name: 'Tập thể Xuất sắc 2025', nameEn: 'Outstanding Collective 2025' },
                  ].map((category, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 w-full"
                      style={{
                        borderBottom: index < 2 ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
                        padding: '16px',
                        paddingBottom: index < 2 ? '16px' : '16px',
                        backgroundImage: `url(${cardBackgroundImage.src})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        position: 'relative',
                      }}
                    >
                      {/* Number Box */}
                      <div
                        style={{
                          width: '70px',
                          height: '45px',
                          backgroundColor: 'rgba(225, 198, 147, 1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          paddingLeft: '10px',
                          paddingRight: '10px',
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                            fontStyle: 'normal',
                            fontWeight: 800,
                            fontSize: '36px',
                            lineHeight: '44.28px',
                            letterSpacing: '0%',
                            textAlign: 'center',
                            verticalAlign: 'middle',
                            textTransform: 'uppercase',
                            color: 'rgba(18, 16, 38, 1)',
                          }}
                        >
                          {category.number}
                        </span>
                      </div>

                      {/* Category Name */}
                      <div className="flex-1">
                        <h3
                          style={
                            {
                              fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                              fontStyle: 'normal',
                              fontWeight: 900,
                              fontSize: '28px',
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
                          {category.name}
                        </h3>
                      </div>

                      {/* Vote Button */}
                      <div className="relative" style={{ flexShrink: 0, paddingLeft: '16px', paddingRight: '16px' }}>
                        <button
                          onClick={() => scrollToCategory(4 + index)}
                          className="w-[240px] h-[55px] cursor-pointer"
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
              </div>
            </div>
          </Container>
        </div>
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
          <div
            className="absolute inset-0 z-10 w-full flex items-center justify-center"
            style={{ padding: '12px 16px' }}
          >
            <div className="max-w-6xl mx-auto flex flex-col items-center justify-center gap-6 md:gap-8 w-full">
              {/* Title 1: Hạng mục Bình chọn */}
              <h2
                style={
                  {
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                    fontStyle: 'normal',
                    fontWeight: 900,
                    fontSize: '55px',
                    lineHeight: '100%',
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
                style={{
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                  fontStyle: 'normal',
                  fontWeight: 500,
                  fontSize: '28px',
                  lineHeight: '100%',
                  letterSpacing: '0%',
                  textAlign: 'center',
                  verticalAlign: 'middle',
                  textTransform: 'uppercase',
                  color: 'rgba(255, 255, 255, 1)',
                  margin: 0,
                }}
              >
                {tt(
                  'kết quả dựa trên 70% bình chọn từ cộng đồng & 30% đánh giá từ ban tổ chức',
                  'results based on 70% community voting & 30% organizer evaluation'
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Body3: Categories Section */}
      {!isLoading &&
        categories.map((category) => (
          <div
            key={category.id}
            id={`category-${category.id}`}
            className="relative w-full bg-black py-8 md:py-16"
            style={{
              backgroundImage: `url(${chickenWinnerImage.src})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'repeat',
            }}
          >
            <div className="container mx-auto px-4 sm:px-6">
              <div className="flex flex-col gap-12">
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

                {/* Grid Layout - 4 items per row on desktop, horizontal scroll on mobile */}
                {category.nominees && category.nominees.length > 0 ? (
                  <div
                    className="flex md:grid md:grid-cols-2 lg:grid-cols-4 overflow-x-auto md:overflow-x-visible pb-4 md:pb-0 -mx-4 md:mx-0 px-4 md:px-0"
                    style={{
                      gap: '16px',
                      scrollSnapType: 'x mandatory',
                      WebkitOverflowScrolling: 'touch',
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                    }}
                  >
                    {category.nominees.map((nominee) => (
                      <div
                        key={nominee.id}
                        className="flex flex-col bg-black flex-shrink-0 md:flex-shrink md:w-full"
                        style={{
                          position: 'relative',
                          overflow: 'hidden',
                          minHeight: '400px',
                          maxWidth: '400px',
                          scrollSnapAlign: 'start',
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
                            opacity: 0.3,
                            zIndex: 0,
                            width: '100%',
                            height: '100%',
                          }}
                        />

                        {/* Card Content */}
                        <div
                          className="relative z-10 flex flex-col h-full p-4 justify-between"
                          style={{ minHeight: '400px' }}
                        >
                          {/* Card Title - Top */}
                          <h3
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
                          </h3>

                          {/* Spacer to push content to bottom */}
                          <div style={{ flex: 1 }} />

                          {/* Card Content - Bottom */}
                          <div className="flex flex-col gap-3">
                            <div
                              title={stripHtmlTags(nominee.description)}
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
                              dangerouslySetInnerHTML={{ __html: nominee.description }}
                            />

                            {/* Vote Button and Count */}
                            <div className="flex flex-row items-center gap-3">
                              <div
                                style={{
                                  background: 'linear-gradient(303.62deg, #000000 -52.52%, #5A5A5A 177.26%)',
                                  borderRadius: '9999px',
                                  padding: '1px',
                                }}
                              >
                                <button
                                  onClick={() => handleVoteClick(nominee.socialIframe, nominee.voteCount || 0)}
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
                                    color: 'rgba(255, 255, 255, 1)',
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
                                    color: 'rgba(255, 255, 255, 1)',
                                  }}
                                >
                                  {tt('lượt', 'votes')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-white text-center">{tt('Chưa có ứng viên nào', 'No nominees yet')}</div>
                )}

                {/* Hide scrollbar for mobile and set desktop width */}
                <style jsx>{`
                  div[style*='scrollSnapType']::-webkit-scrollbar {
                    display: none;
                  }
                  @media (min-width: 768px) {
                    div[style*='scrollSnapType'] > div {
                      width: 100% !important;
                      max-width: none !important;
                    }
                  }
                `}</style>
              </div>
            </div>
          </div>
        ))}

      {/* Facebook Vote Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth={false}
        fullWidth
        PaperProps={{
          sx: {
            width: { xs: '90%', sm: '85%', md: '600px' },
            maxWidth: '600px',
            borderRadius: { xs: '8px', md: '12px' },
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(165.61deg, #323232 -4.98%, #000000 107.54%)',
          },
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(165.61deg, #323232 -4.98%, #000000 107.54%)',
          }}
        >
          {/* Close Button */}
          <IconButton
            onClick={handleCloseDialog}
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              zIndex: 10,
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
              <Typography
                sx={{
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                  fontWeight: 900,
                  fontSize: { xs: '18px', md: '20px' },
                  textTransform: 'uppercase',
                  color: '#E1C693',
                }}
              >
                {tt('Hướng dẫn bình chọn', 'Voting Instructions')}
              </Typography>

              <Typography
                sx={{
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                  fontWeight: 400,
                  fontSize: { xs: '13px', md: '14px' },
                  color: '#E1C693',
                  lineHeight: 1.5,
                }}
              >
                {tt(
                  'Vui lòng truy cập bài đăng Facebook bên dưới và nhấn “Thích” cho bài đăng để hoàn tất việc bình chọn.',
                  'Please access the Facebook post below and like the post to complete the voting process.'
                )}
              </Typography>
            </Stack>
          </Box>

          {/* Part 3: Body Iframe - Square */}
          <Box
            sx={{
              paddingX: { xs: '48px', md: '120px' },
            }}
          >
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                paddingTop: '100%', // Creates 1:1 aspect ratio
                overflow: 'hidden',
                border: '3px solid #E1C693',
              }}
            >
              {selectedSocialIframe && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                  }}
                  dangerouslySetInnerHTML={{ __html: selectedSocialIframe }}
                />
              )}
            </Box>
          </Box>

          {/* Part 4: Footer Button and Vote Count */}
          <Box
            sx={{
              padding: { xs: '24px 16px', md: '24px 20px' },
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
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
                    fontSize: '14px',
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
                    fontSize: '12px',
                    lineHeight: '100%',
                    letterSpacing: '0%',
                    verticalAlign: 'middle',
                    color: '#E1C693',
                  }}
                >
                  {tt('lượt', 'votes')}
                </span>
              </div>
            )}
          </Box>
        </Box>
      </Dialog>

      {/* Footer */}
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
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row gap-8 justify-between items-stretch">
            {/* Part 1: Logo and Description */}
            <div className="flex flex-col gap-4 justify-between h-full md:h-auto" style={{ flex: '1 1 0%' }}>
              <Image
                src={fcoiceLogo}
                alt="FCHOICE 2025"
                width={200}
                height={80}
                className="h-auto"
                style={{ height: 'auto' }}
              />
              <p
                style={{
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                  fontWeight: 400,
                  fontSize: '14px',
                  lineHeight: '20px',
                  color: '#FFFFFF',
                  textAlign: 'left',
                }}
              >
                {tt(
                  'FChoice là bảng bình chọn do Cafef.vn – công bố hàng năm, nhằm tôn vinh những sự kiện, nhân vật, chính sách, công ty...nổi bật nhất trong nền kinh tế Việt Nam.',
                  'FChoice is an annual voting board announced by Cafef.vn, aiming to honor the most outstanding events, figures, policies, companies... in the Vietnamese economy.'
                )}
              </p>
            </div>

            {/* Part 2: Contact, Address, and Organizing Unit */}
            <div className="flex flex-col gap-6 justify-between md:h-auto">
              <div className="flex flex-col sm:flex-row gap-6">
                {/* Contact Information */}
                <div className="flex flex-col gap-2">
                  <h4
                    style={{
                      fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                      fontWeight: 500,
                      fontSize: '14px',
                      lineHeight: '16px',
                      textTransform: 'uppercase',
                      color: '#FFFFFF',
                      marginBottom: '8px',
                    }}
                  >
                    {tt('THÔNG TIN LIÊN HỆ', 'CONTACT INFORMATION')}
                  </h4>
                  <p
                    style={{
                      fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                      fontWeight: 400,
                      fontSize: '14px',
                      lineHeight: '20px',
                      color: '#FFFFFF',
                    }}
                  >
                    info@cafef.vn
                  </p>
                  <p
                    style={{
                      fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                      fontWeight: 400,
                      fontSize: '14px',
                      lineHeight: '20px',
                      color: '#FFFFFF',
                    }}
                  >
                    (+84) 84 7611565
                  </p>
                </div>

                {/* Address */}
                <div className="flex flex-col gap-2">
                  <h4
                    style={{
                      fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                      fontWeight: 500,
                      fontSize: '14px',
                      lineHeight: '16px',
                      textTransform: 'uppercase',
                      color: '#FFFFFF',
                      marginBottom: '8px',
                    }}
                  >
                    {tt('ĐỊA CHỈ', 'ADDRESS')}
                  </h4>
                  <p
                    style={{
                      fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                      fontWeight: 400,
                      fontSize: '14px',
                      lineHeight: '20px',
                      color: '#FFFFFF',
                    }}
                  >
                    Hapulico Complex, Center Building, số 01,
                    <br />
                    phố Nguyễn Huy Tưởng, phường Thanh
                    <br />
                    Xuân, Thành phố Hà Nội
                  </p>
                </div>
              </div>

              {/* Organizing Unit */}
              <div className="flex flex-col gap-4">
                <h4
                  style={{
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                    fontWeight: 500,
                    fontSize: '14px',
                    lineHeight: '16px',
                    textTransform: 'uppercase',
                    color: '#FFFFFF',
                  }}
                >
                  {tt('ĐƠN VỊ TỔ CHỨC', 'ORGANIZING UNIT')}
                </h4>
                <div className="flex gap-6 items-center">
                  <Image
                    src={vccorpLogo}
                    alt="VCCORP"
                    width={120}
                    height={40}
                    className="h-auto"
                    style={{ height: 'auto' }}
                  />
                  <Image
                    src={cafefLogo}
                    alt="CAFEF"
                    width={120}
                    height={40}
                    className="h-auto"
                    style={{ height: 'auto' }}
                  />
                </div>
              </div>
            </div>

            {/* Part 3: Social Media, Copyright and Privacy Policy */}
            <div
              className="flex flex-col gap-6 items-start md:items-end justify-between md:h-auto"
              style={{ flex: '1 1 0%' }}
            >
              {/* Social Media */}
              <div className="flex flex-col sm:flex-row gap-2 sm:justify-center items-start sm:items-center">
                <h4
                  style={{
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                    fontWeight: 500,
                    fontSize: '14px',
                    lineHeight: '16px',
                    textTransform: 'uppercase',
                    color: '#FFFFFF',
                  }}
                >
                  {tt('THEO DÕI CHÚNG TÔI TẠI', 'FOLLOW US AT')}
                </h4>
                <div className="flex gap-4">
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center"
                  >
                    <Image src={facebookIcon} alt="Facebook" width={20} height={20} />
                  </a>
                  <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="flex items-center">
                    <Image src={tiktokIcon} alt="TikTok" width={18} height={20} />
                  </a>
                </div>
              </div>

              {/* Copyright and Privacy Policy */}
              <div className="flex flex-col gap-2 items-start md:items-end">
                <p
                  style={{
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                    fontWeight: 400,
                    fontSize: '12px',
                    lineHeight: '16px',
                    color: '#FFFFFF',
                    textAlign: 'right',
                  }}
                >
                  © Copyright 2025 {tt('Công ty cổ phần VCCorp', 'VCCorp Joint Stock Company')}
                </p>
                <a
                  href="/privacy-policy"
                  style={{
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                    fontWeight: 400,
                    fontSize: '12px',
                    lineHeight: '16px',
                    textTransform: 'uppercase',
                    color: '#FFFFFF',
                    textDecoration: 'none',
                  }}
                >
                  {tt('CHÍNH SÁCH BẢO MẬT', 'PRIVACY POLICY')}
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
