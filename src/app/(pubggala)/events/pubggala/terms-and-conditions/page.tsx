'use client';

import React, { useState } from 'react';
import logo from '@/images/pubg/logo.png';
import { Box, Container, Typography } from '@mui/material';

import { useTranslation } from '@/contexts/locale-context';
import PubgGalaPageHeader from '@/components/pubggala/ui/pubggala-page-header';

import Image from 'next/image';
import buttonBackgroundImage from '@/images/pubg/button-background.png';
import backgroundImage from '@/images/pubg/KV_PUBG_GALA_16x9.jpg';
import { LocalizedLink } from '@/components/pubggala/localized-link';

export default function TermsAndConditionsPage() {
  const { tt } = useTranslation();
  const [activeSection, setActiveSection] = useState<string>('');

  const sections = [
    { id: 'intro', title: 'I. Giới thiệu chung', titleEn: 'I. General Introduction' },
    { id: 'theme', title: 'II. Chủ đề / Thông điệp', titleEn: 'II. Theme / Message' },
    { id: 'mechanism', title: 'III. Cơ chế Bình chọn & Vinh danh', titleEn: 'III. Voting & Honoring Mechanism' },
  ];

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 120; // Khoảng cách với header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div
      className="relative w-full min-h-screen"
      style={{
        background: 'linear-gradient(165.61deg, #323232 -4.98%, #000000 107.54%)',
        position: 'relative',
      }}
    >
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
            animation: gradient-shift 9s ease-in-out infinite;
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
                  {tt('VINH DANH & BÌNH CHỌN', 'HONOR & VOTE')}
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
                  href="/events/pubggala#award-categories-list"
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
      <div style={{ position: 'relative', zIndex: 10 }}>

        <Container maxWidth="xl" className="w-full py-32 md:py-32">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            {/* Sidebar Navigation */}
            <aside className="w-full lg:w-64 flex-shrink-0">
              <nav className="sticky top-24">
                <ul className="space-y-4">
                  {sections.map((section) => (
                    <li key={section.id}>
                      <button
                        onClick={() => scrollToSection(section.id)}
                        className={`text-left w-full transition-colors ${
                          activeSection === section.id ? 'text-[#E1C693]' : 'text-white hover:text-[#E1C693]'
                        }`}
                        style={{
                          fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                          fontSize: '16px',
                          fontWeight: 900,
                          fontStyle: 'normal',
                          lineHeight: '150%',
                          letterSpacing: '0%',
                          verticalAlign: 'middle',
                          padding: '8px 0',
                          cursor: 'pointer',
                          border: 'none',
                          color: activeSection === section.id ? '#E1C693' : '#FFFFFF',
                        }}
                      >
                        {tt(section.title, section.titleEn)}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1" style={{ position: 'relative' }}>
              {/* Background Logo - chỉ cho phần main content */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  zIndex: 0,
                  opacity: 0.1,
                  pointerEvents: 'none',
                }}
              >
                <Image src={logo} alt="PUBG Logo" fill style={{ objectFit: 'cover', objectPosition: 'center' }} priority />
              </div>
              
              <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Title */}
              <Typography
                variant="h1"
                className="text-white"
                style={{
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                  fontSize: '32px',
                  fontWeight: 900,
                  fontStyle: 'normal',
                  lineHeight: '150%',
                  letterSpacing: '0%',
                  verticalAlign: 'middle',
                  color: 'rgba(255, 255, 255, 1)',
                  marginBottom: '44px',
                }}
              >
                {tt('Thể lệ Chính thức PUBG Gala 2025', 'Official Rules PUBG Gala 2025')}
              </Typography>

              {/* Section I: Giới thiệu chung */}
              <section 
                id="intro" 
                className="mb-8 md:mb-12" 
                style={{ 
                  scrollMarginTop: '120px',
                  borderLeft: activeSection === 'intro' ? '3px solid #E1C693' : '3px solid transparent',
                  paddingLeft: activeSection === 'intro' ? '16px' : '16px',
                  transition: 'border-color 0.3s ease',
                }}
              >
                <Typography
                  variant="h2"
                  className="text-white mb-4 md:mb-6"
                  style={{
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                    fontSize: '16px',
                    fontWeight: 900,
                    fontStyle: 'normal',
                    lineHeight: '150%',
                    letterSpacing: '0%',
                    verticalAlign: 'middle',
                    color: 'rgba(255, 255, 255, 1)',
                  }}
                >
                  {tt('I. Giới thiệu chung', 'I. General Introduction')}
                </Typography>
                <Typography
                  className="text-white"
                  style={{
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                    fontSize: '14px',
                    fontWeight: 500,
                    fontStyle: 'normal',
                    lineHeight: '150%',
                    letterSpacing: '0%',
                    verticalAlign: 'middle',
                    color: 'rgba(255, 255, 255, 1)',
                    marginTop: '16px',
                  }}
                  dangerouslySetInnerHTML={{
                    __html: tt(
                      'PUBG Gala 2025 – Gala of Glory là sự kiện vinh danh đặc biệt, lần đầu tiên được tổ chức nhằm nhìn lại hành trình một năm đầy cảm xúc của cộng đồng PUBG Việt Nam. Không chỉ đơn thuần là một buổi lễ trao giải, sự kiện lần này là không gian để chúng ta cùng kể lại những câu chuyện nỗ lực và những cột mốc đáng nhớ mà các cá nhân, tập thể đã cùng nhau tạo nên trong năm qua. Sự kiện hy vọng sẽ trở thành cầu nối để những giá trị tốt đẹp của Esports được lan tỏa, đồng thời tạo tiền đề cho những bước tiến mới của cộng đồng trong tương lai.',
                      'PUBG Gala 2025 - Gala of Glory is a special event, the first of its kind, organized to reflect on a year of emotions within the Vietnamese PUBG community. This is more than just an awards ceremony; it is a space to share stories of effort and memorable milestones achieved by individuals and teams. The event aims to connect and spread positive Esports values, setting the stage for future advancements within the community.'
                    ),
                  }}
                />
              </section>

              {/* Section II: Chủ đề / Thông điệp */}
              <section 
                id="theme" 
                className="mb-8 md:mb-12" 
                style={{ 
                  scrollMarginTop: '120px',
                  borderLeft: activeSection === 'theme' ? '3px solid #E1C693' : '3px solid transparent',
                  paddingLeft: activeSection === 'theme' ? '16px' : '16px',
                  transition: 'border-color 0.3s ease',
                }}
              >
                <Typography
                  variant="h2"
                  className="text-white mb-4 md:mb-6"
                  style={{
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                    fontSize: '16px',
                    fontWeight: 900,
                    fontStyle: 'normal',
                    lineHeight: '150%',
                    letterSpacing: '0%',
                    verticalAlign: 'middle',
                    color: 'rgba(255, 255, 255, 1)',
                  }}
                >
                  {tt('II. Chủ đề / Thông điệp', 'II. Theme / Message')}
                </Typography>
                <Typography
                  className="text-white"
                  style={{
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                    fontSize: '14px',
                    fontWeight: 500,
                    fontStyle: 'normal',
                    lineHeight: '150%',
                    letterSpacing: '0%',
                    verticalAlign: 'middle',
                    color: 'rgba(255, 255, 255, 1)',
                    marginTop: '16px',
                  }}
                  dangerouslySetInnerHTML={{
                    __html: tt(
                      'Năm 2025 khép lại với biết bao kỷ niệm và những bước chuyển mình đáng nhớ. Với chủ đề \'Gala of Glory\', buổi lễ là dịp để chúng ta cùng nhìn lại hành trình vinh quang, đồng thời tri ân những gương mặt đã bền bỉ cống hiến để viết nên chương tiếp theo cho sự phát triển của PUBG nước nhà. Đây là khoảnh khắc tôn vinh sự đoàn kết và ngọn lửa đam mê mà mỗi cá nhân đã dành trọn cho cộng đồng trong suốt năm qua.',
                      '2025 concludes with many memories and significant transformations. The theme "Gala of Glory" makes the ceremony an opportunity to look back at a glorious journey and acknowledge the dedicated individuals who have contributed to the development of PUBG in Vietnam. It is a moment to honor the unity and passion that each person has devoted to the community throughout the past year.'
                    ),
                  }}
                />
              </section>

              {/* Section III: Cơ chế Bình chọn & Vinh danh */}
              <section 
                id="mechanism" 
                className="mb-8 md:mb-12" 
                style={{ 
                  scrollMarginTop: '120px',
                  borderLeft: activeSection === 'mechanism' ? '3px solid #E1C693' : '3px solid transparent',
                  paddingLeft: activeSection === 'mechanism' ? '16px' : '16px',
                  transition: 'border-color 0.3s ease',
                }}
              >
                <Typography
                  variant="h2"
                  className="text-white mb-4 md:mb-6"
                  style={{
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                    fontSize: '16px',
                    fontWeight: 900,
                    fontStyle: 'normal',
                    lineHeight: '150%',
                    letterSpacing: '0%',
                    verticalAlign: 'middle',
                    color: 'rgba(255, 255, 255, 1)',
                  }}
                >
                  {tt('III. Cơ chế Bình chọn & Vinh danh', 'III. Voting & Honoring Mechanism')}
                </Typography>
                <Typography
                  className="text-white mb-6"
                  style={{
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                    fontSize: '14px',
                    fontWeight: 500,
                    fontStyle: 'normal',
                    lineHeight: '150%',
                    letterSpacing: '0%',
                    verticalAlign: 'middle',
                    color: 'rgba(255, 255, 255, 1)',
                    marginTop: '16px',
                  }}
                  dangerouslySetInnerHTML={{
                    __html: tt(
                      'Để đảm bảo sự công bằng và tính chuyên môn cao nhất, hệ thống giải thưởng được chia thành hai danh mục riêng biệt:',
                      'To ensure the highest fairness and professionalism, the award system is divided into two distinct categories:'
                    ),
                  }}
                />

                {/* Danh sách Đề cử */}
                <Box className="mb-8" style={{ paddingLeft: '20px' }}>
                  <Typography
                    variant="h3"
                    className="text-white mb-4"
                    style={{
                      fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                      fontSize: '16px',
                      fontWeight: 900,
                      fontStyle: 'normal',
                      lineHeight: '150%',
                      letterSpacing: '0%',
                      verticalAlign: 'middle',
                      color: '#E1C693',
                    }}
                  >
                    {tt('Danh sách Đề cử (Hạng mục Ấn tượng)', 'Nomination List (Impressive Category)')}
                  </Typography>
                  <Typography
                    className="text-white mb-4"
                    style={{
                      fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                      fontSize: '14px',
                      fontWeight: 500,
                      fontStyle: 'normal',
                      lineHeight: '150%',
                      letterSpacing: '0%',
                      verticalAlign: 'middle',
                      color: 'rgba(255, 255, 255, 1)',
                    }}
                    dangerouslySetInnerHTML={{
                      __html: tt(
                        'Kết quả dựa trên sự đồng thuận giữa cộng đồng và Ban Tổ Chức.',
                        'The results are based on a consensus between the community and the Organizing Committee.'
                      ),
                    }}
                  />
                  <Box className="ml-4 space-y-3">
                    <Typography
                      className="text-white"
                      style={{
                        fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                        fontSize: '14px',
                        fontWeight: 500,
                        fontStyle: 'normal',
                        lineHeight: '150%',
                        letterSpacing: '0%',
                        verticalAlign: 'middle',
                        color: 'rgba(255, 255, 255, 1)',
                      }}
                    >
                      <span style={{ color: '#E1C693', fontWeight: 900 }}>70%</span>{' '}
                      {tt(
                        'Điểm bình chọn từ Người hâm mộ: Ghi nhận sức hút và tình cảm của cộng đồng dành cho các hạng mục như Tuyển thủ Ấn tượng, Đội tuyển Ấn tượng, Streamer được yêu thích và Đội ngũ truyền thông.',
                        'Fan voting points: Recognizing the appeal and affection from the community for categories such as Impressive Player, Impressive Team, Favorite Streamer, and Media Team.'
                      )}
                    </Typography>
                    <Typography
                      className="text-white"
                      style={{
                        fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                        fontSize: '14px',
                        fontWeight: 500,
                        fontStyle: 'normal',
                        lineHeight: '150%',
                        letterSpacing: '0%',
                        verticalAlign: 'middle',
                        color: 'rgba(255, 255, 255, 1)',
                      }}
                    >
                      <span style={{ color: '#E1C693', fontWeight: 900 }}>30%</span>{' '}
                      {tt(
                        'Điểm đánh giá từ Hội đồng chuyên môn: Đảm bảo các tiêu chí về đạo đức nghề nghiệp, sự nỗ lực và đóng góp bền bỉ của ứng viên.',
                        'Professional Council evaluation points: Ensuring criteria related to professional ethics, effort, and sustained contributions of candidates.'
                      )}
                    </Typography>
                  </Box>
                </Box>

                {/* Danh sách Vinh danh */}
                <Box className="mb-8" style={{ paddingLeft: '20px' }}>
                  <Typography
                    variant="h3"
                    className="text-white mb-4"
                    style={{
                      fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                      fontSize: '16px',
                      fontWeight: 900,
                      fontStyle: 'normal',
                      lineHeight: '150%',
                      letterSpacing: '0%',
                      verticalAlign: 'middle',
                      color: '#E1C693',
                    }}
                  >
                    {tt('Danh sách Vinh danh (Hạng mục Xuất sắc)', 'Honoring List (Excellent Category)')}
                  </Typography>
                  <Typography
                    className="text-white mb-4"
                    style={{
                      fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                      fontSize: '14px',
                      fontWeight: 500,
                      fontStyle: 'normal',
                      lineHeight: '150%',
                      letterSpacing: '0%',
                      verticalAlign: 'middle',
                      color: 'rgba(255, 255, 255, 1)',
                    }}
                    dangerouslySetInnerHTML={{
                      __html: tt(
                        'Đây là những giải thưởng cao quý nhất dành cho các hạng mục Tuyển thủ Xuất sắc, Đội tuyển Xuất sắc và Tập thể Xuất sắc.',
                        'These are the most prestigious awards for categories including Excellent Player, Excellent Team, and Excellent Collective.'
                      ),
                    }}
                  />
                  <Box className="ml-4">
                    <Typography
                      className="text-white mb-2"
                      style={{
                        fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                        fontSize: '16px',
                        fontWeight: 900,
                        fontStyle: 'normal',
                        lineHeight: '150%',
                        letterSpacing: '0%',
                        verticalAlign: 'middle',
                        color: '#E1C693',
                      }}
                    >
                      {tt('Hình thức:', 'Format:')}
                    </Typography>
                    <Typography
                      className="text-white"
                      style={{
                        fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                        fontSize: '14px',
                        fontWeight: 500,
                        fontStyle: 'normal',
                        lineHeight: '150%',
                        letterSpacing: '0%',
                        verticalAlign: 'middle',
                        color: 'rgba(255, 255, 255, 1)',
                      }}
                      dangerouslySetInnerHTML={{
                        __html: tt(
                          'Được thẩm định và quyết định trực tiếp bởi Ban Tổ Chức PUBG Gala 2025 dựa trên hệ thống thành tích thi đấu trong nước và quốc tế cũng như những cống hiến đặc biệt quan trọng trong năm.',
                          'Directly reviewed and decided by the PUBG Gala 2025 Organizing Committee based on the system of achievements in domestic and international competitions as well as particularly important contributions throughout the year.'
                        ),
                      }}
                    />
                  </Box>
                </Box>
              </section>
              </div>
            </main>
          </div>
        </Container>
      </div>
    </div>
  );
}
