"use client";

import { useEffect, useState, useContext } from "react";
import { AxiosResponse } from "axios";
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import dayjs from "dayjs";
import { Box } from "@mui/material";

// Define TypeScript interface matching FastAPI schema
interface TransactionECodeResponse {
  name: string;
  eCode: string;
}


interface SelectedComponent {
  key: string;
  label: string;
}

interface ComponentSettings {
  width: number;
  height: number;
  top: number;
  left: number;
  fontSize: number;
  color: string;
}

interface WelcomeBannerImage {
  imageUrl: string;
}

interface WelcomeBannerSettings {
  imageUrl: string;
  selectedComponents: SelectedComponent[];
  componentSettings: Record<string, ComponentSettings>;
}

export default function Page({ params }: { params: { event_id: number } }): React.JSX.Element {
  const { event_id } = params;

  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  // Selected components state
  const [selectedComponents, setSelectedComponents] = useState<Record<string, SelectedComponent>>({});
  const [componentSettings, setComponentSettings] = useState<Record<string, ComponentSettings>>({});
  const [imagePreview, setImagePreview] = useState<string>();

  useEffect(() => {
    const fetchImage = async () => {
      try {
        setIsLoading(true);
        const response: AxiosResponse<WelcomeBannerImage> = await baseHttpServiceInstance.get(
          `/mini-app-welcome-banner/${event_id}/image`
        );

        if (response.status === 200) {
          const { imageUrl } = response.data;

          setImagePreview(imageUrl);
        }
      } catch (error: any) {
        setError(`${error}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchImage();
  }, [event_id]);

  // useEffect(() => {
  //   const fetchSettings = async () => {
  //     try {
  //       setIsLoading(true);
  //       const response: AxiosResponse<WelcomeBannerSettings> = await baseHttpServiceInstance.get(
  //         `mini-app-welcome-banner/${event_id}/transaction`
  //       );

  //       if (response.status === 200) {
  //         const { selectedComponents, componentSettings } = response.data;

  //         setSelectedComponents(
  //           selectedComponents.reduce((acc, component) => {
  //             acc[component.key] = component;
  //             return acc;
  //           }, {} as Record<string, SelectedComponent>)
  //         );
  //         setComponentSettings(componentSettings);
  //       }
  //     } catch (error: any) {
  //       setError(`${error}`);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };

  //   fetchSettings();
  // }, [event_id]);

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
      {isLoading ? (
        <div className="absolute text-white text-lg bg-black/60 px-4 py-2 rounded-md">
          Loading...
        </div>
      ) : error && (<div className="absolute text-white text-lg bg-black/60 px-4 py-2 rounded-md">
        {error}
      </div>)}
      {/* Event Image */}
      <div
        style={{
          height: '100vh',
          maxHeight: '100vh',
          maxWidth: '100vw',
          margin: 'auto',
          position: 'absolute',
          top: '0',
          bottom: '0',
          left: '0',
          right: '0',
          textAlign: 'center',
          containerType: 'inline-size',
          overflow: 'hidden',
        }}
      >
        {/* Wrapper that Resizes to Fit Image */}
        <div
          style={{
            position: "relative",
            display: "inline-block",
            width: "100%",
            height: "100%",
            containerType: 'inline-size'
          }}
        >
          <Box component="img"
            src={imagePreview}
            alt="Event Image"
            sx={{
              width: "100%",
              height: "100%",
              display: "block",
              objectFit: "contain",
              objectPosition: "center",
              borderRadius: "8px",
            }}
          />

          {/* Overlaying Components */}
          {Object.values(selectedComponents).map(({ key, label }) => (
            <div
              key={key}
              style={{
                position: "absolute",
                top: `${componentSettings[key]?.top}%`,
                left: `${componentSettings[key]?.left}%`,
                width: `${componentSettings[key]?.width}%`,
                height: `${componentSettings[key]?.height}%`,
                fontSize: `${componentSettings[key]?.fontSize / 10}cqw`,
                color: `#${componentSettings[key]?.color}`,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                borderRadius: "1.5%",
              }}
            >
              {key === 'eCodeQr' ?
                <Box component="img"
                  sx={{
                    width: "100%", // Image takes full width of the wrapper
                    height: "auto", // Height is adjusted to maintain aspect ratio
                    display: "block", // Removes extra spacing under inline images
                    objectFit: "contain", // Ensures the image fits within the box
                    objectPosition: "top",
                  }}
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${label}`}
                  alt="QR Code"
                  className="bg-white p-2 shadow-lg"
                />
                :
                (key === 'startDateTime' || key === 'endDateTime') ?
                  dayjs(label || 0).format('HH:mm DD/MM/YYYY')
                  :
                  <span dangerouslySetInnerHTML={{ __html: label }} />
              }
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
