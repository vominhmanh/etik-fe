"use client";

import { useEffect, useState, useContext } from "react";
import { AxiosResponse } from "axios";
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import dayjs from "dayjs";
import NotificationContext from "@/contexts/notification-context";
import React from "react";
import { RandomReveal } from "react-random-reveal";
import { Button } from "@mui/material";
import { ArrowCounterClockwise } from "@phosphor-icons/react/dist/ssr";

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
  // Handle Start button: set all intervals to 0.05
  const handleStartBtn = () => {
    const newIntervals = Array(10).fill(0.05); // Set all intervals to 0.05 initially
    const newPlaying = Array(10).fill(true); // Set all intervals to 0.05 initially
    const newInitials = Array(10).fill(false); // Set all intervals to 0.05 initially
    setIntervals(newIntervals);
    setIsPlaying(newPlaying);
    setInitials(newInitials);
    setCurrentRevealIndex(0); // Start from the first reveal
  };

  // Handle Stop button: set individual intervals and stop after 3 seconds
  const handleStopBtn = () => {
    if (currentRevealIndex < 10) {
      const newIntervals = [...intervals];
      newIntervals[currentRevealIndex] = 0.15; // Set the current reveal to 0.3
      setIntervals(newIntervals);
      const curIdx = currentRevealIndex
      // Reset the interval to 0 after 3 seconds
      setTimeout(() => {
        const newIsPlaying = [...isPlaying];
        newIsPlaying[curIdx] = false; // Set the current reveal's interval to 0
        setIsPlaying(newIsPlaying);
      }, 3000); // Adjust the time for sequential stopping

      setCurrentRevealIndex(old => old + 1); // Increment the reveal index
    }
  };

  // Handle Start button: set all intervals to 0.05
  const handleStartBtnOne = (index: number) => {
    const newIntervals = [...intervals] // Set all intervals to 0.05 initially
    const newPlaying = [...isPlaying] // Set all intervals to 0.05 initially
    const newInitials = [...initials] // Set all intervals to 0.05 initially
    newPlaying[index] = true
    newInitials[index] = false
    newIntervals[index] = 0.05
    setIntervals(newIntervals);
    setIsPlaying(newPlaying);
    setInitials(newInitials);
  };

  // Handle Stop button: set individual intervals and stop after 3 seconds
  const handleStopBtnOne = (index: number) => {
    const newIntervals = [...intervals];
    newIntervals[index] = 0.15; // Set the current reveal to 0.3
    setIntervals(newIntervals);
    // Reset the interval to 0 after 3 seconds
    setTimeout(() => {
      setIsPlaying((nowIsPlaying) => {
        const newIsPlaying = [...nowIsPlaying]
        newIsPlaying[index] = false; // Set the current reveal's interval to 0
        return newIsPlaying
      });
    }, 3000); // Adjust the time for sequential stopping

  };

  // Render the reveals
  const renderRandomReveals = () => {
    return Array.from({ length: 10 }, (_, index) => (
      <div
        key={index}
        className="text-white fw-bold"
        style={{
          position: 'absolute',
          zIndex: 2,
          textAlign: 'center',
          color: 'white',
          fontSize: '1.8cqw',
          whiteSpace: 'nowrap',
          textShadow: '0 0 5% black',
          top: `${41 + (index % 5) * 9.5}%`,
          left: index < 5 ? '20%' : '54.5%',
        }}
      >
        <RandomReveal
          isPlaying={isPlaying[index]} // Only reveal if current index is less or equal
          duration={Infinity}
          updateInterval={intervals[index]} // Dynamic interval based on state
          characterSet={initials[index] ? [`LuckyUser${index + 1}`] : formValues.customDrawList}
          characters=" "
        />
      </div>
    ));
  };

  return (
    <>
      
        <div
          style={{
            width: '100vw',
            height: 'calc(9 / 16 * 100vw)',
            maxHeight: '100vh',
            maxWidth: 'calc(16 / 9 * 100vh)',
            margin: 'auto',
            position: 'absolute',
            top: '0',
            bottom: '0',
            left: '0',
            right: '0',
            // backgroundColor: 'pink',
            textAlign: 'center',
            containerType: 'inline-size',
          }}
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            style={{
              width: '95%',
              height: '95%',
              objectFit: 'contain',
              display: 'block',
              position: 'absolute',
            }}
          >
            <source
              src="https://media.etik.io.vn/lucky_wheel_ghost_legend_2025_background.webm"
              type="video/webm"
            />
            Your browser does not support the video tag.
          </video>
          <Button
            variant="contained"
            color="success"
            size="small"
            // disabled={isPlaying}
            onClick={handleStartBtn}
            sx={{
              position: 'absolute',
              width: '2%',
              height: '5%',
              fontSize: '1cqw',
              top: '95%',
              left: '0%',
            }}
          >
            QuayAll
          </Button>
          {Array.from({ length: 10 }).map((_, index) => (
            <Button
              key={`start-${index}`}
              variant="contained"
              color="success"
              size="small"
              onClick={() => handleStartBtnOne(index)}
              sx={{
                position: 'absolute',
                zIndex: '2',
                width: '2%',
                height: '5%',
                fontSize: '1cqw',
                left: `${20 + (index * 6)}%`, // Stacking buttons vertically
                top: '95%',
                display: !isPlaying[index] ? 'block' : 'none', 
              }}
            >
              Q{index + 1}
            </Button>
          ))}

          {/* Render Dừng buttons */}
          {Array.from({ length: 10 }).map((_, index) => (
            <Button
              key={`stop-${index}`}
              variant="contained"
              color="error"
              size="small"
              disabled={!isPlaying[index]}
              onClick={() => handleStopBtnOne(index)}
              sx={{
                position: 'absolute',
                width: '3%',
                height: '5%',
                fontSize: '0.8cqw',
                zIndex: '2',
                left: `${20 + (index * 6)}%`, // Stacking buttons vertically
                top: '95%',
                display: isPlaying[index] ? 'block' : 'none', 
              }}
            >
              D{index + 1}
            </Button>
          ))}
          <div style={{ width: '95%', height: '95%', position: 'absolute' }}>
            {renderRandomReveals()}
          </div>
          <Button
            variant="contained"
            color="primary"
            size="small"
            disabled={isLoading}
            onClick={() => fetchConfig()}
            sx={{
              position: 'absolute',
              width: '12%',
              height: '5%',
              fontSize: '1cqw',
              top: '95%',
              right: '0%',
            }}
          >
            List quay: {formValues.customDrawList.length} <ArrowCounterClockwise /> 
          </Button>
        </div>
    </>
  );
}
