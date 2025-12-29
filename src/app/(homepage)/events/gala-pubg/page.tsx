import Hero from "@/components/gala-pubg/hero-home";
import BusinessCategories from "@/components/gala-pubg/business-categories";
import FeaturesPlanet from "@/components/gala-pubg/features-planet";
import LargeTestimonial from "@/components/gala-pubg/large-testimonial";
import Cta from "@/components/gala-pubg/cta";
import CreateYourEvent from "@/components/gala-pubg/create-your-event";
import CustomerAlbum from "@/components/gala-pubg/customer-album";
import FeaturesAlbum from "@/components/gala-pubg/features-album";

export const metadata = {
  title: "ETIK - Vé điện tử & Quản lý sự kiện",
  description:
    "Phần mềm vé điện tử và quản lý sự kiện hiện đại, dễ dàng và tiết kiệm với tính năng tạo vé điện tử, gửi vé về email, quản lý sự kiện, check-in,...",
  openGraph: {
    title: 'ETIK - Vé điện tử & Quản lý sự kiện',
    description: 'Phần mềm vé điện tử và quản lý sự kiện hiện đại, dễ dàng và tiết kiệm với tính năng tạo vé điện tử, gửi vé về email, quản lý sự kiện, check-in,...',
    images: [{
      url: '/assets/etik-logo1.png',
    }],
  }
};

export default function Home() {
  return (
    <>
      <Hero />
      <FeaturesAlbum />
      <CreateYourEvent />
      <BusinessCategories />
      <FeaturesPlanet />
      <CustomerAlbum />
      <LargeTestimonial />
      <Cta />
    </>
  );
}
