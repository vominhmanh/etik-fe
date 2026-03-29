"use client";

import { useTranslation } from "@/contexts/locale-context";
import {
  ArrowRight,
  Clock as ClockIcon,
  Eye,
  HouseLine as HouseLineIcon,
  MapPin as MapPinIcon,
  Smiley as ScanSmileyIcon,
  UserPlus,
} from "@phosphor-icons/react/dist/ssr";

type ValueCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

type ProductItemProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

function ValueCard({ icon, title, description }: ValueCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-900">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function ProductItem({ icon, title, description }: ProductItemProps) {
  return (
    <div className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-900">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      </div>
    </div>
  );
}

export default function About() {
  const { tt } = useTranslation();

  return (
    <section className="mx-auto max-w-4xl px-4 py-5 sm:px-6 md:py-6">
      <div className="space-y-10 rounded-3xl border border-gray-100 bg-white p-6 shadow-xl sm:p-8 md:p-12">
        {/* About us */}
        <div className="space-y-8">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
              <HouseLineIcon size={18} weight="bold" />
              {tt("Về chúng tôi", "About us")}
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              {tt(
                "Công ty TNHH Tiên Phong Thông Minh",
                "Tien Phong Smart Co., Ltd."
              )}
            </h2>

            <p className="mt-5 text-base leading-7 text-slate-600">
              {tt(
                "(TienPhongSmart Co.,Ltd) là một công ty công nghệ chuyên cung cấp các giải pháp phần mềm và ứng dụng trí tuệ nhân tạo (AI) cho doanh nghiệp và tổ chức trong nước.",
                "(TienPhongSmart Co.,Ltd) is a technology company specializing in software solutions and artificial intelligence (AI) applications for businesses and organizations in Vietnam."
              )}
            </p>

            <p className="mt-4 text-base leading-7 text-slate-600">
              {tt(
                "Với đội ngũ kỹ sư và chuyên gia giàu kinh nghiệm, chúng tôi cam kết mang đến các giải pháp công nghệ tiên tiến, giúp khách hàng tối ưu hóa quy trình vận hành và nâng cao hiệu quả kinh doanh.",
                "With a team of experienced engineers and experts, we are committed to delivering advanced technology solutions that help customers optimize operations and improve business performance."
              )}
            </p>

            <p className="mt-4 text-base leading-7 text-slate-600">
              {tt(
                "Chúng tôi không ngừng đổi mới và cập nhật các xu hướng công nghệ mới nhất để đáp ứng nhu cầu đa dạng của thị trường.",
                "We continuously innovate and stay up to date with the latest technology trends to meet the diverse needs of the market."
              )}
            </p>
          </div>

          <div className="rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-200">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-900 shadow-sm ring-1 ring-slate-200">
                  <Eye size={20} weight="bold" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {tt("Tầm nhìn công nghệ", "Technology vision")}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {tt(
                      "Định hướng phát triển các sản phẩm hiện đại, có khả năng mở rộng và phù hợp với nhu cầu thực tế của doanh nghiệp.",
                      "We focus on building modern, scalable products that align with real business needs."
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-900 shadow-sm ring-1 ring-slate-200">
                  <ClockIcon size={20} weight="bold" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {tt(
                      "Triển khai nhanh, vận hành ổn định",
                      "Fast deployment, stable operation"
                    )}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {tt(
                      "Ưu tiên tốc độ, tính ổn định và khả năng đồng hành lâu dài cùng khách hàng trong quá trình sử dụng.",
                      "We prioritize speed, reliability, and long-term support throughout the customer journey."
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-900 shadow-sm ring-1 ring-slate-200">
                  <UserPlus size={20} weight="bold" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {tt("Hỗ trợ tận tâm", "Dedicated support")}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {tt(
                      "Đồng hành cùng khách hàng từ tư vấn, triển khai cho đến bảo trì và tối ưu hệ thống.",
                      "We support customers from consultation and deployment to maintenance and system optimization."
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Core values */}
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-12 rounded-full bg-slate-900" />
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              {tt("Giá trị cốt lõi", "Core values")}
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <ValueCard
              icon={<Eye size={24} weight="bold" />}
              title={tt("Công nghệ tiên tiến", "Advanced technology")}
              description={tt(
                "Cập nhật xu hướng mới nhất vào từng sản phẩm, mang đến giải pháp tối ưu cho khách hàng.",
                "We bring the latest trends into every product to deliver optimal solutions for customers."
              )}
            />
            <ValueCard
              icon={<ClockIcon size={24} weight="bold" />}
              title={tt("Chất lượng đảm bảo", "Quality assured")}
              description={tt(
                "Lấy chất lượng làm trọng tâm phát triển để khách hàng yên tâm trong quá trình sử dụng.",
                "We place quality at the center of our development so customers can use our products with confidence."
              )}
            />
            <ValueCard
              icon={<HouseLineIcon size={24} weight="bold" />}
              title={tt("Sản phẩm đa dạng", "Diverse products")}
              description={tt(
                "Hệ sinh thái sản phẩm đa dạng, đáp ứng nhiều nhu cầu sử dụng và mô hình kinh doanh khác nhau.",
                "Our diverse product ecosystem supports a wide range of use cases and business models."
              )}
            />
            <ValueCard
              icon={<UserPlus size={24} weight="bold" />}
              title={tt("Hỗ trợ tận tâm", "Dedicated support")}
              description={tt(
                "Luôn sẵn sàng lắng nghe ý kiến từ khách hàng để cải tiến dịch vụ và nâng cao trải nghiệm.",
                "We are always ready to listen to customer feedback to improve our services and enhance the experience."
              )}
            />
          </div>
        </div>

        {/* Products */}
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-12 rounded-full bg-slate-900" />
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              {tt("Sản phẩm của chúng tôi", "Our products")}
            </h2>
          </div>

          <div className="space-y-4">
            <ProductItem
              icon={<MapPinIcon size={22} weight="bold" />}
              title={tt(
                "Hệ thống Quản lý sự kiện ETIK",
                "ETIK Event Management System"
              )}
              description={tt(
                "Nền tảng bán vé và quản lý sự kiện hiện đại, hỗ trợ nhà tổ chức phân phối vé đến khách hàng nhanh chóng, dễ dàng và tiết kiệm.",
                "A modern event ticketing and management platform that helps organizers distribute tickets to customers quickly, easily, and cost-effectively."
              )}
            />

            <ProductItem
              icon={<ScanSmileyIcon size={22} weight="bold" />}
              title={tt(
                "Phần mềm Quản lý Nhà thông minh",
                "Smart Home Management Software"
              )}
              description={tt(
                "Giải pháp điều khiển các thiết bị thông minh trong nhà chỉ qua một nút bấm, mang lại trải nghiệm tiện nghi và linh hoạt hơn.",
                "A solution that lets users control smart home devices with a single tap, creating a more convenient and flexible experience."
              )}
            />

            <ProductItem
              icon={<ArrowRight size={22} weight="bold" />}
              title={tt(
                "Phát triển các dự án outsourcing của đối tác",
                "Partner outsourcing projects"
              )}
              description={tt(
                "Chúng tôi triển khai các dự án được cá nhân hóa cho từng khách hàng, đáp ứng nhu cầu và mục đích kinh doanh cụ thể.",
                "We deliver customized projects for each client, tailored to their specific goals and business needs."
              )}
            />

            <ProductItem
              icon={<Eye size={22} weight="bold" />}
              title={tt(
                "Phát triển các dự án trí tuệ nhân tạo",
                "Artificial intelligence projects"
              )}
              description={tt(
                "Chúng tôi nghiên cứu và triển khai các sản phẩm tích hợp AI, giúp khách hàng tối đa hóa quy trình và hiệu suất vận hành.",
                "We research and build AI-integrated products that help customers maximize workflows and operational efficiency."
              )}
            />
          </div>
        </div>
      </div>
    </section>
  );
}