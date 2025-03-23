"use client"

import Image from "next/image";
import TestimonialImg from "@/images/a.jpg";
// import Swiper core and required modules
import { Navigation, Pagination, A11y } from 'swiper/modules';
import Feature1 from "@/images/tinh_nang_1.png";
import Feature2 from "@/images/tinh_nang_2.png";
import Feature3 from "@/images/tinh_nang_3.png";
import Feature4 from "@/images/tinh_nang_4.png";
import Feature5 from "@/images/tinh_nang_5.png";
import CustomerMixiCup from "@/images/customer-mixicup.jpg";
import CustomerRefundMeeting from "@/images/customer-refund-meeting.png";
import CustomerGeforce from "@/images/customer-geforce-fans-party.jpg";

import { Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/scrollbar';

export default function FeaturesAlbum() {
  return (
    <section>
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="py-12 md:py-20">
          <div className="space-y-3 text-center">
            <h2 className="mb-6 border-y text-3xl font-bold text-gray-700 [border-image:linear-gradient(to_right,transparent,theme(colors.slate.700/.7),transparent)1] md:mb-12 md:text-4xl">
              Tính năng của ETIK
            </h2>
            <Swiper
              modules={[Navigation, Pagination, A11y]}
              slidesPerView={1}
              navigation
              loop={true}
            >
              <SwiperSlide style={{height: 500, justifyItems: 'center'}}>
                <Image
                  className="box-content border-2 border-gray-50"
                  src={Feature1}
                  height={1200}
                  alt="Avatar 01"
                />
              </SwiperSlide>
              
              <SwiperSlide style={{height: 500, justifyItems: 'center'}}>
                <Image
                  className="box-content border-2 border-gray-50"
                  src={Feature2}
                  height={1200}
                  alt="Avatar 01"
                />
              </SwiperSlide>

              <SwiperSlide style={{height: 500, justifyItems: 'center'}}>
                <Image
                  className="box-content border-2 border-gray-50"
                  src={Feature3}
                  height={1200}
                  alt="Avatar 01"
                />
              </SwiperSlide>
              
              <SwiperSlide style={{height: 500, justifyItems: 'center'}}>
                <Image
                  className="box-content border-2 border-gray-50"
                  src={Feature4}
                  height={1200}
                  alt="Avatar 01"
                />
              </SwiperSlide>
              <SwiperSlide style={{height: 500, justifyItems: 'center'}}>
                <Image
                  className="box-content border-2 border-gray-50"
                  src={Feature5}
                  height={1200}
                  alt="Avatar 01"
                />
              </SwiperSlide>
            </Swiper>
          </div>
        </div>
      </div>
      <span id="create-your-event" style={{marginTop: '-40px'}}></span>
    </section>
  );
}
