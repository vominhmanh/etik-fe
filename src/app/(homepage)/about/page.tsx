// src/app/(homepage)/(default)/page.tsx
import type { Metadata } from "next";
import Hero from "./hero-home";
import Cta from "./cta";
import About from "./about";
import CustomerAlbum from "@/components/homepage/customer-album";
import Footer from "@/components/homepage/ui/footer";

export const metadata: Metadata = {
  title: "ETIK - Vé điện tử & Quản lý sự kiện",
  description:
    "Phần mềm vé điện tử và quản lý sự kiện hiện đại, dễ dàng và tiết kiệm với tính năng tạo vé điện tử, gửi vé về email, quản lý sự kiện, check-in,...",
  openGraph: {
    title: "ETIK - Vé điện tử & Quản lý sự kiện",
    description:
      "Phần mềm vé điện tử và quản lý sự kiện hiện đại, dễ dàng và tiết kiệm với tính năng tạo vé điện tử, gửi vé về email, quản lý sự kiện, check-in,...",
    images: [
      {
        url: "/assets/etik-logo1.png",
      },
    ],
  },
};

export default function Home() {
  return (
    <>
      
      <Hero />
      <About />
      <CustomerAlbum />
      <Cta />
      
    </>
  );
}
