"use client";

import { useEffect, useState, useContext } from "react";
import { AxiosResponse } from "axios";
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import dayjs from "dayjs";
import NotificationContext from "@/contexts/notification-context";
import { useTranslation } from '@/contexts/locale-context';
import React from "react";
import { Box } from "@mui/material";
import { useRouter } from "next/navigation";
import luckyDrawMainAppBackground from "@/images/mini-app-lucky-draw/lucky_draw_main_app_background.jpg";
import ghostLegend2025Icon from "@/images/mini-app-lucky-draw/ghost-legend-2025-icon.png";
import pubgGala2025Icon from "@/images/mini-app-lucky-draw/pubg-gala-2025.png";

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

export interface GetLuckyDrawConfigResponse {
  listType: string;
  customDrawList: string[];
}

export interface LuckyNumberAppConfig {
  luckyNumberOptionMode: string;
  customList?: string;
}

export default function Page({ params }: { params: { event_id: number } }): React.JSX.Element {
  const { event_id } = params;
  const { tt, locale } = useTranslation();
  const notificationCtx = useContext(NotificationContext);
  const [initials, setInitials] = useState([true, true, true, true, true, true, true, true, true, true]);
  const [data, setData] = useState<TransactionECodeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedComponents, setSelectedComponents] = useState<Record<string, SelectedComponent>>({});
  const [componentSettings, setComponentSettings] = useState<Record<string, ComponentSettings>>({});
  const [imagePreview, setImagePreview] = useState<string>();
  const [isPlaying, setIsPlaying] = useState([false, false, false, false, false, false, false, false, false, false]);
  const [intervals, setIntervals] = useState([0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05]); // For 3 reveals, initially set to 0.1 each
  const [formValues, setFormValues] = React.useState<GetLuckyDrawConfigResponse>({
    listType: '',
    customDrawList: [],
  });


  const [currentRevealIndex, setCurrentRevealIndex] = useState<number>(0);
  const router = useRouter();

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    if (!event_id) return;

    try {
      setIsLoading(true);
      const response: AxiosResponse<GetLuckyDrawConfigResponse> = await baseHttpServiceInstance.get(
        `/mini-app-lucky-draw/${params.event_id}/get-draw-list`
      );

      const config = response.data;
      if (config) {
        setFormValues({
          listType: config.listType,
          customDrawList: config.customDrawList,
        });
      }
    } catch (error) {
      notificationCtx.error(error);
    } finally {
      setIsLoading(false);
    }
  }


  return (
    <>
      {isLoading ? (
        <div className="absolute text-white text-lg bg-black/60 px-4 py-2 rounded-md">
          {tt("Đang tải...", "Loading...")}
        </div>
      ) : (
        <div
          style={{
            width: '100vw',
            height: 'calc(9 / 16 * 100vw)',
            maxHeight: '100vh',
            maxWidth: 'calc(16 / 9 * 100vh)',
            margin: 'auto',
            position: 'relative',
            top: '0',
            bottom: '0',
            left: '0',
            right: '0',
            textAlign: 'center',
            containerType: 'inline-size',
          }}
        >
          <Box component="img"
            src={luckyDrawMainAppBackground.src}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
              position: 'absolute',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '15%',  // Adjust the vertical position below the icon
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '3cqw',
              color: 'white',
              fontWeight: 'bold',
            }}
          >
            {tt("Chọn giao diện Quay số may mắn", "Choose Lucky Draw Interface")}
          </div>
          {/* Absolute squared div (like an app icon button) */}
          <div
            onClick={() => { 
              const path = `/event-studio/events/${event_id}/mini-app-lucky-draw/ghost-legend-2025`;
              router.push(locale === 'en' ? `/en${path}` : path);
            }} // Use Next.js router for navigation
            style={{
              position: 'absolute',
              top: '30%',  // Adjust vertical position
              left: '12%',  // Evenly spaced: 12% margin + 0% offset
              width: '10%',  // Each icon is 10% wide
              aspectRatio: '1/1.5',  // Maintain aspect ratio for the container
              cursor: 'pointer'
            }}
          >
            <Box component="img"
              src={ghostLegend2025Icon.src}  // Path to the app icon image
              alt="App Icon"
              sx={{
                width: '100%',  // Image takes up 100% of the parent width
                height: 'auto',  // Maintain the image's aspect ratio
                borderRadius: '10%',  // Rounded corners
                boxShadow: '0 10px 20px rgba(0, 0, 0, 0.3)',
              }}
            />

            {/* App name below the icon */}
            <div
              style={{
                position: 'absolute',
                width: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '1.5cqw',
                color: 'white',
                fontWeight: 'bold',
              }}
            >
              Ghost Legend 2025
            </div>
          </div>

          <div
            onClick={() => { 
              const path = `/event-studio/events/${event_id}/mini-app-lucky-draw/ghost-legend-2025-20`;
              router.push(locale === 'en' ? `/en${path}` : path);
            }} // Use Next.js router for navigation
            style={{
              position: 'absolute',
              top: '30%',  // Adjust vertical position
              left: '34%',  // Evenly spaced: 12% + 10% + 12% = 34%
              width: '10%',  // Each icon is 10% wide
              aspectRatio: '1/1.5',  // Maintain aspect ratio for the container
              cursor: 'pointer'
            }}
          >
            <Box component="img"
              src={ghostLegend2025Icon.src}  // Path to the app icon image
              alt="App Icon"
              sx={{
                width: '100%',  // Image takes up 100% of the parent width
                height: 'auto',  // Maintain the image's aspect ratio
                borderRadius: '10%',  // Rounded corners
                boxShadow: '0 10px 20px rgba(0, 0, 0, 0.3)',
              }}
            />

            {/* App name below the icon */}
            <div
              style={{
                position: 'absolute',
                width: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '1.5cqw',
                color: 'white',
                fontWeight: 'bold',
              }}
            >
              Ghost Legend 20 users
            </div>
          </div>

          <div
            onClick={() => { 
              const path = `/event-studio/events/${event_id}/mini-app-lucky-draw/ghost-legend-2025-5`;
              router.push(locale === 'en' ? `/en${path}` : path);
            }} // Use Next.js router for navigation
            style={{
              position: 'absolute',
              top: '30%',  // Adjust vertical position
              left: '56%',  // Evenly spaced: 34% + 10% + 12% = 56%
              width: '10%',  // Each icon is 10% wide
              aspectRatio: '1/1.5',  // Maintain aspect ratio for the container
              cursor: 'pointer'
            }}
          >
            <Box component="img"
              src={ghostLegend2025Icon.src}  // Path to the app icon image
              alt="App Icon"
              sx={{
                width: '100%',  // Image takes up 100% of the parent width
                height: 'auto',  // Maintain the image's aspect ratio
                borderRadius: '10%',  // Rounded corners
                boxShadow: '0 10px 20px rgba(0, 0, 0, 0.3)',
              }}
            />

            {/* App name below the icon */}
            <div
              style={{
                position: 'absolute',
                width: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '1.5cqw',
                color: 'white',
                fontWeight: 'bold',
              }}
            >
              Ghost Legend 5 users
            </div>
          </div>

          <div
            onClick={() => { 
              const path = `/event-studio/events/${event_id}/mini-app-lucky-draw/pubg-gala-2025`;
              router.push(locale === 'en' ? `/en${path}` : path);
            }} // Use Next.js router for navigation
            style={{
              position: 'absolute',
              top: '30%',  // Adjust vertical position
              left: '78%',  // Evenly spaced: 56% + 10% + 12% = 78%
              width: '10%',  // Each icon is 10% wide
              aspectRatio: '1/1.5',  // Maintain aspect ratio for the container
              cursor: 'pointer'
            }}
          >
            <Box component="img"
              src={pubgGala2025Icon.src}  // Path to the app icon image
              alt="App Icon"
              sx={{
                width: '100%',  // Image takes up 100% of the parent width
                height: 'auto',  // Maintain the image's aspect ratio
                borderRadius: '10%',  // Rounded corners
                boxShadow: '0 10px 20px rgba(0, 0, 0, 0.3)',
              }}
            />

            {/* App name below the icon */}
            <div
              style={{
                position: 'absolute',
                width: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '1.5cqw',
                color: 'white',
                fontWeight: 'bold',
              }}
            >
              PUBG Gala 2025
            </div>
          </div>
        </div>
      )}
    </>
  );
}
