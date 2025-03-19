"use client";

import Image from "next/image";
import { useEffect, useState, useContext } from "react";
import { AxiosResponse } from "axios";
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import NotificationContext from '@/contexts/notification-context';

// Define TypeScript interface matching FastAPI schema
interface TransactionECodeResponse {
  name: string;
  eCode: string;
}

export default function Page({ params }: { params: { event_id: number; transaction_id: number } }): React.JSX.Element {
  const { event_id, transaction_id } = params;
  const notificationCtx = useContext(NotificationContext);

  const [isMobile, setIsMobile] = useState(false);
  const [data, setData] = useState<TransactionECodeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch check-in e-code
  useEffect(() => {
    const fetchECode = async () => {
      try {
        setIsLoading(true);
        const response: AxiosResponse<TransactionECodeResponse> = await baseHttpServiceInstance.get(
          `/event-studio/events/${event_id}/transactions/${transaction_id}/check-in-e-code`
        );
        setData(response.data);
      } catch (error) {
        notificationCtx.error("Lỗi:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchECode();
  }, [event_id, transaction_id]);

  // Detect mobile screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {/* Event Image */}
      <div
        style={{
          position: "relative",
          height: "1000px",
          maxHeight: "100vh",
          width: "600px",
          maxWidth: "100vw",
          display: "flex",
          justifyContent: "center",
          alignItems: "start", // Aligns the image at the top
          overflow: "hidden",
        }}
      >
        {/* Wrapper that Resizes to Fit Image */}
        <div
          style={{
            position: "relative",
            display: "inline-block",
            width: "100%", // Takes full width of the parent
            height: "auto", // Adjusts height based on the image's aspect ratio
            containerType: 'size',
          }}
        >
          {/* Image with Aspect Ratio Maintained */}
          <img
            style={{
              width: "100%", // Image takes full width of the wrapper
              height: "auto", // Height is adjusted to maintain aspect ratio
              display: "block", // Removes extra spacing under inline images
              objectFit: "contain", // Ensures the image fits within the box
              objectPosition: "top",
            }}
            src="https://media.etik.io.vn/events/28/event_images/7ebfc214-c468-492a-808a-5b9c9557a6ae.png"
            alt="Event Image"
          />

          {/* Floating Name Over Image */}
          {data && (
            <h2
              style={{
                position: "absolute",
                top: "28cqw",
                left: "50%",
                transform: "translate(-50%, -50%)",
                fontSize: "4cqw", // Responsive font scaling
                margin: "0",
              }}
              className="font-semibold"
            >
              {data.name}
            </h2>

          )}
          {/* QR Code Overlay (40% from Left, 60% from Top) */}
          {data && (
            <div  style={{
              position: "absolute",
              top: "92cqw",
              left: "49%",
              transform: "translate(-50%, -50%)",
              fontSize: "4cqw", // Responsive font scaling
              margin: "0",
            }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=132x132&data=${data.eCode}`}
                alt="QR Code"
                className="w-[150px] h-[150px] bg-white p-2 rounded-md shadow-lg"
              />
            </div>
          )}
        </div>
      </div>
      {/* Full Name Overlay (Centered, 30% from Top) */}




      {/* Loading State */}
      {isLoading && (
        <div className="absolute text-white text-lg bg-black/60 px-4 py-2 rounded-md">
          Loading...
        </div>
      )}
    </>
  );
}
