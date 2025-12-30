import Hero from "@/components/pubggala/hero-home";
import BusinessCategories from "@/components/pubggala/business-categories";
import FeaturesPlanet from "@/components/pubggala/features-planet";
import LargeTestimonial from "@/components/pubggala/large-testimonial";
import Cta from "@/components/pubggala/cta";
import CreateYourEvent from "@/components/pubggala/create-your-event";
import CustomerAlbum from "@/components/pubggala/customer-album";
import FeaturesAlbum from "@/components/pubggala/features-album";

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
