"use client";
import Image from "next/image";
import PageIllustration from "@/components/homepage/page-illustration";
import Avatar01 from "@/images/avatar-01.jpg";
import Avatar02 from "@/images/avatar-02.jpg";
import Avatar03 from "@/images/avatar-03.jpg";
import Avatar04 from "@/images/avatar-04.jpg";
import Avatar05 from "@/images/avatar-05.jpg";
import Avatar06 from "@/images/avatar-06.jpg";
import { useTranslation } from '@/contexts/locale-context';

import { useState, FormEvent } from "react";
import Link from "next/link";

export default function HeroHome() {
  const { tt } = useTranslation();
  const [showPopup, setShowPopup] = useState(false);

  const handleCreateEvent = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Cast e.target to HTMLFormElement to ensure access to the fields
    const form = e.target as HTMLFormElement;

    // Extract data from form fields
    const eventData = {
      eventName: (form.elements.namedItem("eventName") as HTMLInputElement).value,
      organizer: (form.elements.namedItem("organizer") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      phone: (form.elements.namedItem("phone") as HTMLInputElement).value,
    };

    try {
      // Giả lập gọi API
      const res = await fetch("/api/create-event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      });

      if (!res.ok) {
        throw new Error("Lỗi khi tạo sự kiện");
      }
      setShowPopup(true);
    } catch (error) {
      console.error("Error:", error);
      alert("Có lỗi xảy ra, vui lòng thử lại.");
    }
  };

  return (
    <section className="relative">
      <PageIllustration />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Hero content */}
        <div className="pb-6 pt-32 md:pb-20 md:pt-40">
          {/* Section header */}
          <div className="pb-6 text-center md:pb-16">
            <div
              className="mb-6 border-y [border-image:linear-gradient(to_right,transparent,theme(colors.slate.300/.8),transparent)1]"
              data-aos="zoom-y-out"
            >
              <div className="-mx-0.5 flex justify-center -space-x-3">
                <Image
                  className="box-content rounded-full border-2 border-gray-50"
                  src={Avatar01}
                  width={32}
                  height={32}
                  alt="Avatar 01"
                />
                <Image
                  className="box-content rounded-full border-2 border-gray-50"
                  src={Avatar02}
                  width={32}
                  height={32}
                  alt="Avatar 02"
                />
                <Image
                  className="box-content rounded-full border-2 border-gray-50"
                  src={Avatar03}
                  width={32}
                  height={32}
                  alt="Avatar 03"
                />
                <Image
                  className="box-content rounded-full border-2 border-gray-50"
                  src={Avatar04}
                  width={32}
                  height={32}
                  alt="Avatar 04"
                />
                <Image
                  className="box-content rounded-full border-2 border-gray-50"
                  src={Avatar05}
                  width={32}
                  height={32}
                  alt="Avatar 05"
                />
                <Image
                  className="box-content rounded-full border-2 border-gray-50"
                  src={Avatar06}
                  width={32}
                  height={32}
                  alt="Avatar 06"
                />
              </div>
            </div>
            <h1
              className="mb-6 border-y text-5xl font-bold [border-image:linear-gradient(to_right,transparent,theme(colors.slate.300/.8),transparent)1] md:text-6xl"
              data-aos="zoom-y-out"
              data-aos-delay={150}
            >
              {tt("Gala of Glory", "Gala of Glory")}
            </h1>
            <h1
              className="mb-6 border-y text-5xl font-bold [border-image:linear-gradient(to_right,transparent,theme(colors.slate.300/.8),transparent)1] md:text-6xl"
              data-aos="zoom-y-out"
              data-aos-delay={850}
            >
              {tt("PUBG 2025", "PUBG 2025")}
            </h1>
            <div className="mx-auto max-w-3xl">
              <p
                className="mb-8 text-lg text-gray-700"
                data-aos="zoom-y-out"
                data-aos-delay={1000}
              >
                {tt("ETIK giúp bạn tạo sự kiện và bán vé nhanh chóng, tiện lợi và tiết kiệm. Không những thế, loạt tính năng hỗ trợ sự kiện đi kèm giúp sự kiện của bạn trở nên hiện đại và chuyên nghiệp hơn bao giờ hết. Khám phá ngay !", "ETIK helps you create events and sell tickets quickly, conveniently, and economically. Moreover, a series of accompanying event support features make your event more modern and professional than ever. Explore now!")}
              </p>
              
              <div className="relative before:absolute before:inset-0 before:border-y before:[border-image:linear-gradient(to_right,transparent,theme(colors.slate.300/.8),transparent)1]">
                <div
                  className="mx-auto max-w-xs sm:flex sm:max-w-none sm:justify-center"
                  data-aos="zoom-y-out"
                  data-aos-delay={1000}
                >
                  <a
                    className="btn group mb-4 w-full bg-gradient-to-t from-blue-600 to-blue-500 bg-[length:100%_100%] bg-[bottom] text-white shadow hover:bg-[length:100%_150%] sm:mb-0 sm:w-auto"
                    href="#create-your-event"
                  >
                    <span className="relative inline-flex items-center">
                      <span style={{marginRight: '10px'}}>{tt("Bạn là Nhà tổ chức sự kiện?", "Are you an Event Organizer?")}</span>{" "}<b>{tt("Tạo sự kiện ngay", "Create Event Now")}</b>
                      {/* <span className="ml-1 tracking-normal text-blue-300 transition-transform group-hover:translate-x-0.5">
                        -&gt;
                      </span> */}
                    </span>
                  </a>
                  <Link
                    className="btn group w-full bg-white text-gray-800 shadow hover:bg-gray-50 sm:ml-4 sm:w-auto"
                    href="/marketplace"
                  >
                    <span className="relative inline-flex items-center">
                    <span style={{marginRight: '10px'}}>{tt("Bạn là khách hàng?", "Are you a customer?")}</span><b>{tt("Đặt vé ngay", "Book Tickets Now")}</b>
                    </span>
                    
                  </Link>
                </div>
              </div>
            </div>
          </div>          
        </div>
      </div>
    </section>
  );
}
