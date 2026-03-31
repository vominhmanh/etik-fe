// src/app/(homepage)/(default)/page.tsx
import type { Metadata } from "next";

import Header from "@/components/homepage/ui/header";
import Footer from "@/components/homepage/ui/footer";
import Hero from "@/components/homepage/hero-home";
import BusinessCategories from "@/components/homepage/business-categories";
import FeaturesPlanet from "@/components/homepage/features-planet";
import LargeTestimonial from "@/components/homepage/large-testimonial";
import Cta from "@/components/homepage/cta";
import CreateYourEvent from "@/components/homepage/create-your-event";
import CustomerAlbum from "@/components/homepage/customer-album";
import FeaturesAlbum from "@/components/homepage/features-album";

export const metadata: Metadata = {
  title: "ETIK - Vé điện tử & Quản lý sự kiện",
  description:
    "Phần mềm vé điện tử và quản lý sự kiện hiện đại, dễ dàng và tiết kiệm với tính năng tạo vé điện tử, gửi vé về email, quản lý sự kiện, check-in,...",
  openGraph: {
    title: "ETIK - Vé điện tử & Quản lý sự kiện",
    description:
      "Phần mềm vé điện tử và quản lý sự kiện hiện đại, dễ dàng và tiết kiệm với tính năng tạo vé điện tử, gửi vé về email, quản lý sự kiện, check-in,...",
    url: "https://etik.vn",
    siteName: "ETIK",
    images: [
      {
        url: "https://etik.vn/assets/etik-logo1.png",
        width: 1200,
        height: 630,
        alt: "ETIK - Vé điện tử & Quản lý sự kiện",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ETIK - Vé điện tử & Quản lý sự kiện",
    description: "Phần mềm vé điện tử và quản lý sự kiện hiện đại, dễ dàng và tiết kiệm với tính năng tạo vé điện tử, gửi vé về email, quản lý sự kiện, check-in,...",
    images: ["https://etik.vn/assets/etik-logo1.png"],
  },
};

export default function Home() {
  return (
    <>
      <Header />
      <Hero />
      <FeaturesAlbum />
      <CreateYourEvent />
      <BusinessCategories />
      <FeaturesPlanet />
      <CustomerAlbum />
      <LargeTestimonial />
      <Cta />
      <Footer border />
    </>
  );
}
