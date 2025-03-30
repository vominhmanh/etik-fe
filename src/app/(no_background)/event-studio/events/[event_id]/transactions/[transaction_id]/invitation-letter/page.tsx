"use client";

import { useEffect, useState, useContext } from "react";
import { AxiosResponse } from "axios";
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import dayjs from "dayjs";

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

interface InvitationLetterSettings {
  imageUrl: string;
  selectedComponents: SelectedComponent[];
  componentSettings: Record<string, ComponentSettings>;
}

export default function Page({ params }: { params: { event_id: number; transaction_id: number } }): React.JSX.Element {
  const { event_id, transaction_id } = params;

  const [isMobile, setIsMobile] = useState(false);
  const [data, setData] = useState<TransactionECodeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  // Selected components state
  const [selectedComponents, setSelectedComponents] = useState<Record<string, SelectedComponent>>({});
  const [componentSettings, setComponentSettings] = useState<Record<string, ComponentSettings>>({});
  const [imagePreview, setImagePreview] = useState<string>();



  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const response: AxiosResponse<InvitationLetterSettings> = await baseHttpServiceInstance.get(
          `/event-studio/events/${event_id}/transactions/${transaction_id}/invitation-letter`
        );

        if (response.status === 200) {
          const { imageUrl, selectedComponents, componentSettings } = response.data;

          setImagePreview(imageUrl);
          setSelectedComponents(
            selectedComponents.reduce((acc, component) => {
              acc[component.key] = component;
              return acc;
            }, {} as Record<string, SelectedComponent>)
          );
          setComponentSettings(componentSettings);
        }
      } catch (error: any) {
        setError(`${error}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [event_id]);

  // Fetch check-in e-code
  useEffect(() => {
    const fetchECode = async () => {
      try {
        setIsLoading(true);
        const response: AxiosResponse<TransactionECodeResponse> = await baseHttpServiceInstance.get(
          `/event-studio/events/${event_id}/transactions/${transaction_id}/check-in-e-code`
        );
        setData(response.data);
      } catch (error: any) {
        setError(error);
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
          position: "relative",
          height: "1000px",
          maxHeight: "100vh",
          width: "500px",
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
            width: "100%",
            height: "auto",
            containerType: 'inline-size'
          }}
        >
          <img
            src={imagePreview}
            alt="Event Image"
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              objectFit: "contain",
              objectPosition: "top",
              borderRadius: "8px",
              marginBottom: "10px",
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
                <img
                  style={{
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
                  label
              }
            </div>
          ))}
        </div>
      </div>
      {/* Full Name Overlay (Centered, 30% from Top) */}




      {/* Loading State */}
      
    </>
  );
}
