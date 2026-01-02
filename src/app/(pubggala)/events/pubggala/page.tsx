'use client';

import Image from 'next/image';
import PubgGalaPageHeader from '@/components/pubggala/ui/pubggala-page-header';
import backgroundImage from '@/images/pubg/KV_PUBG_GALA_16x9.jpg';
import buttonBackgroundImage from '@/images/pubg/button-background.png';
import mockVideoImage from '@/images/pubg/mock-video.png';
import soldierBackgroundImage from '@/images/pubg/soldier-background.png';
import { useTranslation } from '@/contexts/locale-context';
import { LocalizedLink } from '@/components/pubggala/localized-link';

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
                style={{
                  width: '910px',
                  maxWidth: '100%',
                  height: 'auto',
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                  fontStyle: 'normal',
                  fontWeight: 900,
                  fontSize: '72px',
                  lineHeight: '76px',
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
                {tt("Bình chọn PUBG", "Vote PUBG")} Gala of glory
              </h1>

              {/* Description */}
              <p
                style={{
                  width: '476px',
                  maxWidth: '100%',
                  height: 'auto',
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                  fontStyle: 'normal',
                  fontWeight: 900,
                  fontSize: '18px',
                  lineHeight: '23px',
                  display: 'flex',
                  alignItems: 'center',
                  color: '#FFFFFF',
                  flex: 'none',
                  order: 0,
                  flexGrow: 0,
                }}
              >
                {tt(
                  "Tham gia bình chọn các đề cử Gala of glory 2025 nhằm tôn vinh những sự kiện, nhân vật, chính sách, công ty…nổi bật nhất trong nền kinh tế Việt Nam.",
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
                  <div style={{ position: 'relative', width: '200px', height: '60px' }}>
                    <Image
                      src={buttonBackgroundImage}
                      alt={tt("Bình chọn", "Vote")}
                      fill
                      style={{ objectFit: 'contain' }}
                      priority
                    />
                    {/* Text overlay */}
                    <span
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                        fontStyle: 'normal',
                        fontWeight: 900,
                        fontSize: '20px',
                        lineHeight: '24px',
                        textAlign: 'center',
                        textTransform: 'uppercase',
                        color: '#121026',
                        zIndex: 2,
                        pointerEvents: 'none',
                      }}
                    >
                      {tt("Bình chọn", "Vote")}
                    </span>
                  </div>
                </LocalizedLink>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body2: Message Section */}
      <div className="relative w-full bg-black py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col gap-12">
            {/* Title */}
            <h2
              style={{
                fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                fontWeight: 900,
                fontStyle: 'normal',
                fontSize: '48px',
                letterSpacing: '0%',
                verticalAlign: 'middle',
                textTransform: 'uppercase',
                background: 'linear-gradient(90deg, #E1C693 0%, #FFFFFF 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {tt("Thông điệp", "Message")}
            </h2>

            {/* Content: Image left, Text right */}
            <div className="flex flex-col md:flex-row gap-8 items-start w-full">
              {/* Image */}
              <div className="flex-1 w-full md:w-1/2">
                <Image
                  src={mockVideoImage}
                  alt={tt("Thông điệp", "Message")}
                  width={600}
                  height={400}
                  className="w-full h-auto"
                  style={{ objectFit: 'contain' }}
                />
              </div>

              {/* Text Content */}
              <div className="flex-1 w-full md:w-1/2 flex flex-col gap-6">
                <p
                  style={{
                    width: '100%',
                    height: 'auto',
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                    fontStyle: 'normal',
                    fontWeight: 900,
                    fontSize: '18px',
                    lineHeight: '23px',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#FFFFFF',
                    flex: 'none',
                    order: 0,
                    flexGrow: 0,
                  }}
                >
                  {tt(
                    "Gala of glory là nơi vinh danh những thành tựu của các tuyển thủ và các sự kiện liên quan đến PUBG",
                    "Gala of glory is a place to honor the achievements of players and events related to PUBG"
                  )}
                </p>
                <p
                  style={{
                    width: '100%',
                    height: 'auto',
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                    fontStyle: 'normal',
                    fontWeight: 900,
                    fontSize: '18px',
                    lineHeight: '23px',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#FFFFFF',
                    flex: 'none',
                    order: 0,
                    flexGrow: 0,
                  }}
                >
                  {tt(
                    "Gala of glory là nơi vinh danh những thành tựu của các tuyển thủ và các sự kiện liên quan đến PUBG",
                    "Gala of glory is a place to honor the achievements of players and events related to PUBG"
                  )}
                </p>
                <p
                  style={{
                    width: '100%',
                    height: 'auto',
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                    fontStyle: 'normal',
                    fontWeight: 900,
                    fontSize: '18px',
                    lineHeight: '23px',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#FFFFFF',
                    flex: 'none',
                    order: 0,
                    flexGrow: 0,
                  }}
                >
                  {tt(
                    "Gala of glory là nơi vinh danh những thành tựu của các tuyển thủ và các sự kiện liên quan đến PUBG",
                    "Gala of glory is a place to honor the achievements of players and events related to PUBG"
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body3: Categories Section */}
      <div className="relative w-full bg-black py-16">
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
                {tt("HẠNG MỤC", "CATEGORY")}
              </h3>
              {/* Title 2 */}
              <h2
                style={{
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                  fontWeight: 900,
                  fontStyle: 'normal',
                  fontSize: '36px',
                  lineHeight: '48px',
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
                {tt("Tên hạng mục", "Item Name")}
              </h2>
            </div>

            {/* Grid Layout - 4 items per row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="flex flex-col bg-black"
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    minHeight: '400px',
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
                      background: 'linear-gradient(90deg, rgba(225, 198, 147, 0) 0%, #E1C693 50%, rgba(225, 198, 147, 0) 100%)',
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
                  <div className="relative z-10 flex flex-col h-full p-4 justify-between" style={{ minHeight: '400px' }}>
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
                      {tt("Tên hạng mục", "Item Name")}
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
                        "Là danh hiệu dành cho người chơi có thành tích xuất sắc nhất trận đấu, dựa trên tổng hợp các yếu tố như hạ gục (Kills), hỗ trợ (Assists), sát thương gây ra (Damage), sống sót (Survival), và có ảnh hưởng lớn đến kết quả chung cuộc của đội, thường được tính điểm bằng chỉ số tổng hợp",
                        "This is a title for players who have excellent achievements in the match, based on a combination of factors such as kills (Kills), assists (Assists), damage dealt (Damage), survival (Survival), and has a significant impact on the overall outcome of the team, usually scored by a total index"
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Body3: Categories Section */}
      <div className="relative w-full bg-black py-16">
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
                {tt("HẠNG MỤC", "CATEGORY")}
              </h3>
              {/* Title 2 */}
              <h2
                style={{
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                  fontWeight: 900,
                  fontStyle: 'normal',
                  fontSize: '36px',
                  lineHeight: '48px',
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
                {tt("Tên hạng mục", "Item Name")}
              </h2>
            </div>

            {/* Grid Layout - 4 items per row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="flex flex-col bg-black"
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    minHeight: '400px',
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
                      background: 'linear-gradient(90deg, rgba(225, 198, 147, 0) 0%, #E1C693 50%, rgba(225, 198, 147, 0) 100%)',
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
                  <div className="relative z-10 flex flex-col h-full p-4 justify-between" style={{ minHeight: '400px' }}>
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
                      {tt("Tên hạng mục", "Item Name")}
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
                        "Là danh hiệu dành cho người chơi có thành tích xuất sắc nhất trận đấu, dựa trên tổng hợp các yếu tố như hạ gục (Kills), hỗ trợ (Assists), sát thương gây ra (Damage), sống sót (Survival), và có ảnh hưởng lớn đến kết quả chung cuộc của đội, thường được tính điểm bằng chỉ số tổng hợp",
                        "This is a title for players who have excellent achievements in the match, based on a combination of factors such as kills (Kills), assists (Assists), damage dealt (Damage), survival (Survival), and has a significant impact on the overall outcome of the team, usually scored by a total index"
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
