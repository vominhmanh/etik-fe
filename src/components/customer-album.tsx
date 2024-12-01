"use client"

import Image from "next/image";
import TestimonialImg from "@/images/a.jpg";
// import Swiper core and required modules
import { Navigation, Pagination, A11y } from 'swiper/modules';
import CustomerRedline from "@/images/customer-redline.jpg";
import CustomerMixiCup from "@/images/customer-mixicup.jpg";
import CustomerRefundMeeting from "@/images/customer-refund-meeting.png";
import CustomerGeforce from "@/images/customer-geforce-fans-party.jpg";

import { Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/scrollbar';

export default function CustomerAlbum() {
  return (
    <section>
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="py-12 md:py-20">
          <div className="space-y-3 text-center">
            <h2 className="mb-6 border-y text-3xl font-bold text-gray-700 [border-image:linear-gradient(to_right,transparent,theme(colors.slate.700/.7),transparent)1] md:mb-12 md:text-4xl">
              Khách hàng của chúng tôi
            </h2>
            <Swiper
              modules={[Navigation, Pagination, A11y]}
              spaceBetween={50}
              slidesPerView={2}
              navigation
              pagination={{ clickable: true }}
            >
              <SwiperSlide style={{height: 200, width: 'fit-content'}}>
                <Image
                  className="box-content border-2 border-gray-50"
                  src={CustomerMixiCup}
                  height={200}
                  alt="Avatar 01"
                />
              </SwiperSlide>
              
              <SwiperSlide style={{height: 200, width: 'fit-content'}}>
                <Image
                  className="box-content border-2 border-gray-50"
                  src={CustomerGeforce}
                  height={200}
                  alt="Avatar 01"
                />
              </SwiperSlide>

              <SwiperSlide style={{height: 200, width: 'fit-content'}}>
                <Image
                  className="box-content border-2 border-gray-50"
                  src={CustomerRefundMeeting}
                  height={200}
                  alt="Avatar 01"
                />
              </SwiperSlide>
              
              <SwiperSlide style={{height: 200, width: 'fit-content'}}>
                <Image
                  className="box-content border-2 border-gray-50"
                  src={CustomerRedline}
                  height={200}
                  alt="Avatar 01"
                />
              </SwiperSlide>
            </Swiper>
          </div>
        </div>
      </div>
    </section>
  );
}
