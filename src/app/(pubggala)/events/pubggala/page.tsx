'use client';

import Image from 'next/image';
import battlegroundsImage from '@/images/pubg/battlegrounds.png';
import buttonBackgroundImage from '@/images/pubg/button-background.png';
import cafefLogo from '@/images/pubg/cafef.png';
import chickenWinnerImage from '@/images/pubg/chicken-winner.png';
import facebookIcon from '@/images/pubg/facebook.svg';
import fcoiceLogo from '@/images/pubg/fcoice-2025.png';
import backgroundImage from '@/images/pubg/KV_PUBG_GALA_16x9.jpg';
import mockVideoImage from '@/images/pubg/mock-video.png';
import soldierBackgroundImage from '@/images/pubg/soldier-background.png';
import tiktokIcon from '@/images/pubg/tiktok.svg';
import vccorpLogo from '@/images/pubg/vccorp.png';

import { useTranslation } from '@/contexts/locale-context';
import { LocalizedLink } from '@/components/pubggala/localized-link';
import PubgGalaPageHeader from '@/components/pubggala/ui/pubggala-page-header';

export default function Home() {
  const { tt } = useTranslation();
  return (
    <div className="relative w-full">
      {/* Body1: Background Image with Content */}
      <div className="relative w-full" style={{ minHeight: '100vh' }}>
        {/* Background Image with Gradient Overlay */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            src={backgroundImage}
            alt="PUBG GALA Background"
            width={1920}
            height={1080}
            priority
            className="w-full h-auto"
            style={{ zIndex: 0, objectFit: 'cover', width: '100%', height: 'auto', display: 'block' }}
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
        <PubgGalaPageHeader />

        {/* Content Area */}
        <div className="relative z-10 flex items-center pt-14" style={{ minHeight: '100vh' }}>
          <div className="container mx-auto px-4 sm:px-6 w-full">
            <div className="flex flex-col gap-6">
              {/* Title */}
              <h1
                className="text-3xl sm:text-5xl md:text-6xl lg:text-[72px] leading-tight md:leading-[76px]"
                style={{
                  width: '910px',
                  maxWidth: '100%',
                  height: 'auto',
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                  fontStyle: 'normal',
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
                {tt('Bình chọn PUBG', 'Vote PUBG')} Gala of glory
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
                  <div className="w-40 sm:w-48 md:w-[200px] h-12 sm:h-14 md:h-[60px]" style={{ position: 'relative' }}>
                    <Image
                      src={buttonBackgroundImage}
                      alt={tt('Bình chọn', 'Vote')}
                      fill
                      style={{ objectFit: 'contain' }}
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
                      }}
                    >
                      {tt('Bình chọn', 'Vote')}
                    </span>
                  </div>
                </LocalizedLink>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body2: Message Section */}
      <div className="relative w-full bg-black py-8 md:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col gap-12">
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
              }}
            >
              {tt('Thông điệp', 'Message')}
            </h2>

            {/* Content: Image left, Text right */}
            <div className="flex flex-col md:flex-row gap-8 items-start w-full">
              {/* Image */}
              <div className="flex-1 w-full md:w-1/2">
                <Image
                  src={mockVideoImage}
                  alt={tt('Thông điệp', 'Message')}
                  width={600}
                  height={400}
                  className="w-full h-auto"
                  style={{ objectFit: 'contain' }}
                />
              </div>

              {/* Text Content */}
              <div className="flex-1 w-full md:w-1/2 flex flex-col gap-4 md:gap-6">
                <p
                  className="text-sm sm:text-base md:text-lg leading-relaxed"
                  style={{
                    width: '100%',
                    height: 'auto',
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                    fontStyle: 'normal',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    color: '#FFFFFF',
                    flex: 'none',
                    order: 0,
                    flexGrow: 0,
                  }}
                >
                  {tt(
                    'Gala of glory là nơi vinh danh những thành tựu của các tuyển thủ và các sự kiện liên quan đến PUBG',
                    'Gala of glory is a place to honor the achievements of players and events related to PUBG'
                  )}
                </p>
                <p
                  className="text-sm sm:text-base md:text-lg leading-relaxed"
                  style={{
                    width: '100%',
                    height: 'auto',
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                    fontStyle: 'normal',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    color: '#FFFFFF',
                    flex: 'none',
                    order: 0,
                    flexGrow: 0,
                  }}
                >
                  {tt(
                    'Gala of glory là nơi vinh danh những thành tựu của các tuyển thủ và các sự kiện liên quan đến PUBG',
                    'Gala of glory is a place to honor the achievements of players and events related to PUBG'
                  )}
                </p>
                <p
                  className="text-sm sm:text-base md:text-lg leading-relaxed"
                  style={{
                    width: '100%',
                    height: 'auto',
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                    fontStyle: 'normal',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    color: '#FFFFFF',
                    flex: 'none',
                    order: 0,
                    flexGrow: 0,
                  }}
                >
                  {tt(
                    'Gala of glory là nơi vinh danh những thành tựu của các tuyển thủ và các sự kiện liên quan đến PUBG',
                    'Gala of glory is a place to honor the achievements of players and events related to PUBG'
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Battlegrounds Image */}
      <div className="relative w-full">
        <Image
          src={battlegroundsImage}
          alt="Battlegrounds"
          width={1920}
          height={1080}
          className="w-full h-auto"
          style={{ width: '100%', height: 'auto', display: 'block', backgroundColor: '#1E1E1E' }}
          sizes="100vw"
        />
      </div>

      {/* Body3: Categories Section */}
      <div
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
                {tt('Hạng mục vinh danh', 'Awarded Category')}
              </h2>
            </div>

            {/* Grid Layout - 4 items per row on desktop, horizontal scroll on mobile */}
            <div
              className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-x-auto md:overflow-x-visible pb-4 md:pb-0 -mx-4 md:mx-0 px-4 md:px-0"
              style={{
                scrollSnapType: 'x mandatory',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="flex flex-col bg-black flex-shrink-0 md:flex-shrink md:w-full"
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    minHeight: '400px',
                    width: 'calc(100vw - 64px)',
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
                      backgroundImage: `url(${soldierBackgroundImage.src})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      opacity: 0.3,
                      zIndex: 0,
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
                      {tt('Tên hạng mục', 'Item Name')}
                    </h3>

                    {/* Spacer to push content to bottom */}
                    <div style={{ flex: 1 }} />

                    {/* Card Content - Bottom */}
                    <p
                      style={{
                        fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                        fontWeight: 400,
                        fontStyle: 'normal',
                        fontSize: '12px',
                        lineHeight: '100%',
                        letterSpacing: '0%',
                        verticalAlign: 'middle',
                        color: 'rgba(244, 245, 248, 1)',
                        textAlign: 'left',
                      }}
                    >
                      {tt(
                        'Là danh hiệu dành cho người chơi có thành tích xuất sắc nhất trận đấu, dựa trên tổng hợp các yếu tố như hạ gục (Kills), hỗ trợ (Assists), sát thương gây ra (Damage), sống sót (Survival), và có ảnh hưởng lớn đến kết quả chung cuộc của đội, thường được tính điểm bằng chỉ số tổng hợp',
                        'This is a title for players who have excellent achievements in the match, based on a combination of factors such as kills (Kills), assists (Assists), damage dealt (Damage), survival (Survival), and has a significant impact on the overall outcome of the team, usually scored by a total index'
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>

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
            <div className="flex flex-col gap-6 items-start md:items-end justify-between md:h-auto" style={{ flex: '1 1 0%' }}>
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
