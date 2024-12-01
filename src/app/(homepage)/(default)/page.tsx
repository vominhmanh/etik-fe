export const metadata = {
  title: "ETIK - Vé điện tử & Quản lý sự kiện",
  description: "Phần mềm vé điện tử và quản lý sự kiện hiện đại, dễ dàng và tiết kiệm với tính năng tạo vé điện tử, gửi vé về email, quản lý sự kiện, check-in,...",
};

import Hero from "@/components/hero-home";
import BusinessCategories from "@/components/business-categories";
import FeaturesPlanet from "@/components/features-planet";
import LargeTestimonial from "@/components/large-testimonial";
import Cta from "@/components/cta";
import CreateYourEvent from "@/components/create-your-event";
import CustomerAlbum from "@/components/customer-album";

export default function Home() {
  return (
    <>
      <Hero />
      <CreateYourEvent />
      <BusinessCategories />
      <FeaturesPlanet />
      <CustomerAlbum />
      <LargeTestimonial />
      <Cta />
    </>
  );
}
