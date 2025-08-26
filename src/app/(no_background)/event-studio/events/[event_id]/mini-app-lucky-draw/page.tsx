"use client";

import { useEffect, useState, useContext } from "react";
import { AxiosResponse } from "axios";
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import dayjs from "dayjs";
import NotificationContext from "@/contexts/notification-context";
import React from "react";
import { RandomReveal } from "react-random-reveal";
import { Box, Button } from "@mui/material";
import { useRouter } from "next/navigation";

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
          Loading...
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
            src="/assets/lucky_draw_main_app_background.jpg"
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
            Chọn giao diện Quay số may mắn
          </div>
          {/* Absolute squared div (like an app icon button) */}
          <div
            onClick={() => { router.push(`/event-studio/events/${event_id}/mini-app-lucky-draw/ghost-legend-2025`); }} // Use Next.js router for navigation
            style={{
              position: 'absolute',
              top: '30%',  // Adjust vertical position
              left: '20%',  // Center horizontally
              width: '10%',  // Parent takes up 90% of the width
              aspectRatio: '1/1.5',  // Maintain aspect ratio for the container
              cursor: 'pointer'
            }}
          >
            <Box component="img"
              src="/assets/ghost-legend-2025-icon.png"  // Path to the app icon image
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
            onClick={() => { router.push(`/event-studio/events/${event_id}/mini-app-lucky-draw/ghost-legend-2025-20`); }} // Use Next.js router for navigation
            style={{
              position: 'absolute',
              top: '30%',  // Adjust vertical position
              left: '35%',  // Center horizontally
              width: '10%',  // Parent takes up 90% of the width
              aspectRatio: '1/1.5',  // Maintain aspect ratio for the container
              cursor: 'pointer'
            }}
          >
            <Box component="img"
              src="/assets/ghost-legend-2025-icon.png"  // Path to the app icon image
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
        </div>
      )}
    </>
  );
}
