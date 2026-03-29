"use client";
import PageIllustration from "@/components/homepage/page-illustration";

import { useTranslation } from '@/contexts/locale-context';

export default function HeroHome() {
  const { tt } = useTranslation();

  return (
    <section className="relative">
      <PageIllustration />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Hero content */}
        <div className="pb-4 pt-32 md:pb-5 md:pt-40">
          {/* Section header */}
          <div className="pb-4 text-center md:pb-8">

            <h1
              className="mb-6 border-y text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600 [border-image:linear-gradient(to_right,transparent,theme(colors.slate.300/.8),transparent)1] md:text-5xl"
              data-aos="zoom-y-out"
              data-aos-delay={150}
            >
              {tt("Chính sách Bảo mật", "Privacy Policy")}
            </h1>
            <h3
              className="mb-6 border-y text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-500 [border-image:linear-gradient(to_right,transparent,theme(colors.slate.300/.8),transparent)1] md:text-4xl"
              data-aos="zoom-y-out"
              data-aos-delay={850}
            >
              {tt("Hệ thống Quản lý sự kiện ETIK", "ETIK Event Management System")}
            </h3>

          </div>
        </div>
      </div>
    </section>
  );
}
