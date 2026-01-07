"use client";

import { useEffect, useState, useContext, useRef } from "react";
import { AxiosResponse } from "axios";
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import dayjs from "dayjs";
import NotificationContext from "@/contexts/notification-context";
import React from "react";
import { RandomReveal } from "react-random-reveal";
import { Button } from "@mui/material";
import { ArrowCounterClockwise } from "@phosphor-icons/react/dist/ssr";
import { Titillium_Web } from "next/font/google";
import pubgGala2025Background from "@/images/mini-app-lucky-draw/pubg-gala-2025-background.png";
import "./fonts.css";
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

const titillium = Titillium_Web({ subsets: ["latin"], weight: ["400", "600", "700"] });

export default function Page({ params }: { params: { event_id: number } }): React.JSX.Element {
  const { event_id } = params;
  const notificationCtx = useContext(NotificationContext);
  const [initials, setInitials] = useState(Array(2).fill(true));
  const [data, setData] = useState<TransactionECodeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedComponents, setSelectedComponents] = useState<Record<string, SelectedComponent>>({});
  const [componentSettings, setComponentSettings] = useState<Record<string, ComponentSettings>>({});
  const [imagePreview, setImagePreview] = useState<string>();
  const [isPlaying, setIsPlaying] = useState(Array(2).fill(false));
  const [intervals, setIntervals] = useState(Array(2).fill(0.05)); // For 2 reveals, initially set to 0.05 each
  const [durations, setDurations] = useState(Array(2).fill(Infinity)); // For 2 reveals, initially set to Infinity each
  const [results, setResults] = useState<(string | null)[]>(Array(2).fill(null)); // For 2 reveals, initially set to null each
  const [savedResults, setSavedResults] = useState<(string | null)[]>([]); // Saved results
  const [formValues, setFormValues] = React.useState<GetLuckyDrawConfigResponse>({
    listType: '',
    customDrawList: [],
  });
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const [currentRevealIndex, setCurrentRevealIndex] = useState<number>(0);
  const backgroundVideoRef = useRef<HTMLVideoElement | null>(null);
  const [replayToggle, setReplayToggle] = useState<boolean>(false);

  useEffect(() => {
    setSavedResults((prevSaved) => {
      const newItems = results.filter(
        (item) => item !== null && !prevSaved.includes(item)
      ) as string[];
      return [...prevSaved, ...newItems];
    });
  }, [results]);

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
        // setSavedResults([])
        // setOriginalList(config.customDrawList)
      }
    } catch (error) {
      notificationCtx.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  // Handle Start button: set all intervals to 0.05
  const handleStartBtn = () => {
    timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    timeoutsRef.current = [];

    const newIntervals = Array(2).fill(0.05); // Set all intervals to 0.05 initially
    const newPlaying = Array(2).fill(true); // Set all playing to true initially
    const newInitials = Array(2).fill(false); // Set all initials to false initially
    const newDurations = Array(2).fill(Infinity); // Set all durations to Infinity initially
    // setDrawList(originalList)
    setIntervals(newIntervals);
    setIsPlaying(newPlaying);
    setInitials(newInitials);
    setDurations(newDurations);
    setCurrentRevealIndex(0); // Start from the first reveal
  };


  // Handle Start button: set all intervals to 0.05
  const handleStartBtnOne = (index: number) => {
    const newIntervals = [...intervals] // Set all intervals to 0.05 initially
    const newPlaying = [...isPlaying] // Set all intervals to 0.05 initially
    const newDurations = [...durations] // Set all intervals to 0.05 initially
    newPlaying[index] = true
    newIntervals[index] = 0.05
    newDurations[index] = Infinity
    setIntervals(newIntervals);
    setIsPlaying(newPlaying);

    setInitials((oldInitials) => {
      const newInitials = [...oldInitials]
      newInitials[index] = false
      return newInitials
    });
    setDurations(newDurations);
  };
  
  const handleStopBtnOne = (index: number) => {
    // Prevent duplicate picking by ensuring we use the latest state
    setResults((prev) => {
      if (!isPlaying[index]) {
        return prev;
      }

      // Get all used results: current results + saved results
      // Use Set for O(1) lookup performance and to ensure uniqueness
      const usedResultsSet = new Set<string>([
        ...prev.filter((r) => r !== null && r !== undefined) as string[],
        ...savedResults.filter((r) => r !== null && r !== undefined) as string[],
      ]);

      // Check if first item is already used (by index 0 or saved results)
      // If first item is used, exclude it. Otherwise, allow all items to be selected
      const firstItem = formValues.customDrawList[0];
      const availableList = usedResultsSet.has(firstItem)
        ? formValues.customDrawList.slice(1) // Exclude first item if already used
        : formValues.customDrawList; // Allow all items including first if not used

      // Filter out all used items
      const remaining = availableList.filter(
        (name) => !usedResultsSet.has(name)
      );

      // Random selection with proper uniform distribution
      const selected =
        remaining.length === 0
          ? null
          : remaining[Math.floor(Math.random() * remaining.length)];

      const updated = [...prev];
      updated[index] = selected;
      return updated;
    });
    // if (!selected) return;

    // Set the current reveal to slower speed
    setIntervals((oldIntervals) => {
      const newIntervals = [...oldIntervals]
      newIntervals[index] = 0.2;
      return newIntervals
    });

    // setResults((oldResults) => {
    //   const newResults = [...oldResults]
    //   newResults[index] = selected
    //   return newResults
    // })
    // Reset the interval to 0 after 3 seconds
    setTimeout(() => {

      // Step 1: Start playing
      setIsPlaying((prev) => {
        const updated = [...prev];
        updated[index] = true;
        return updated;
      });



      // Step 3: Set the duration
      setDurations((prev) => {
        const updated = [...prev];
        updated[index] = 0;
        return updated;
      });

      // Step 4: Stop playing after 500ms (or however long the reveal takes)
      setTimeout(() => {
        setIsPlaying((prev) => {
          const updated = [...prev];
          updated[index] = false;
          return updated;
        });
      }, 100);
    }, 3000); // Adjust the time for sequential stopping

    setTimeout(() => {
      setIsPlaying((nowIsPlaying) => {
        const newIsPlaying = [...nowIsPlaying]
        newIsPlaying[index] = false; // Set the current reveal's interval to 0
        return newIsPlaying
      });
    }, 2800); // Adjust the time for sequential stopping
  };


  const handleReplayBackground = () => {
    const videoElement = backgroundVideoRef.current;
    if (!videoElement) return;
    try {
      if (!replayToggle) {
        if (videoElement.ended) {
          videoElement.currentTime = 0;
        }
        const playPromise = videoElement.play();
        if (playPromise && typeof (playPromise as any).then === 'function') {
          (playPromise as Promise<void>).catch(() => {});
        }
        setReplayToggle(true);
      } else {
        videoElement.pause();
        videoElement.currentTime = 0;
        setReplayToggle(false);
      }
    } catch {}
  };

  // Render the reveals
  const renderRandomReveals = () => {
    return Array.from({ length: 2 }, (_, index) => (
      <div
        key={index}
        className={`text-white fw-bold text-decoration-italic pubg-gala-reveal-container`}
        style={{
          fontFamily: 'Shuttleblock, sans-serif',
          color: '#fdeac0',
          fontWeight: 700,
          position: 'absolute',
          zIndex: 2,
          textTransform: 'uppercase',
          textAlign: 'center',
          fontSize: '1.8cqw',
          whiteSpace: 'nowrap',
          textShadow: '0 0 5% black',
          top: `${33.4 + (index % 2) * 12.7}%`,
          left: '31%',
          width: '38%',
        }}
      >
        <RandomReveal
          isPlaying={isPlaying[index]} // Only reveal if current index is less or equal
          duration={durations[index]}
          updateInterval={intervals[index]} // Dynamic interval based on state
          characterSet={initials[index] ? [``] : formValues.customDrawList}
          characters={[
            <span 
              key={index}
              style={{
                fontFamily: 'Shuttleblock, sans-serif',
                fontWeight: 700,
              }}
            >
              {results[index]}
            </span>
          ]}
        />
      </div>
    ));
  };

  const handleSaveResults = () => {
    setSavedResults((prevSaved) => {
      const newItems = results.filter(
        (item) => item !== null && !prevSaved.includes(item)
      ) as string[];
      return [...prevSaved, ...newItems];
    });
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
        <img
          src={pubgGala2025Background.src}
          style={{
            width: '95%',
            height: '95%',
            objectFit: 'contain',
            display: 'block',
            position: 'absolute',
          }}
        >
        </img>
        <Button
          variant="contained"
          color="warning"
          size="small"
          // disabled={isPlaying}
          onClick={handleReplayBackground}
          sx={{
            minWidth: '0',
            padding: '0',
            position: 'absolute',
            width: '4%',
            height: '5%',
            fontSize: '1cqw',
            top: '95%',
            left: '0%',
          }}
        >
          Hiệu ứng
        </Button>
        <Button
          variant="contained"
          color="success"
          size="small"
          // disabled={isPlaying}
          onClick={handleStartBtn}
          sx={{
            minWidth: '0',
            padding: '0',
            position: 'absolute',
            width: '4%',
            height: '5%',
            fontSize: '1cqw',
            top: '95%',
            left: '4%',
          }}
        >
          QuayAll
        </Button>
        <Button
          variant="contained"
          color="warning"
          size="small"
          onClick={() => {
            // Temporarily enable isPlaying to trigger reveal

            setIsPlaying(() => {
              setInitials(Array(2).fill(true));
              setResults(Array(2).fill(null));
              setDurations(Array(2).fill(Infinity)); // Set all durations to Infinity initially

              return Array(2).fill(true)

            });
            // Then stop all after a short timeout (e.g. 100ms)
            setTimeout(() => {
              setIsPlaying(Array(2).fill(false));
            }, 200); // You can fine-tune this delay
          }}
          sx={{
            minWidth: '0',
            padding: '0',
            position: 'absolute',
            width: '4%',
            height: '5%',
            fontSize: '1cqw',
            top: '95%',
            left: '12%',
          }}
        >
          ClearAll
        </Button>
        <Button
          variant="contained"
          color="error"
          size="small"
          onClick={() => {
            // Temporarily enable isPlaying to trigger reveal
            // map: set time out to call function handleStopBtnOne(index) with index 1->20
            // delay 500ms each
            timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
            timeoutsRef.current = [];

            for (let i = 0; i < 2; i++) {
              if (!isPlaying[i]) {
                continue
              }
              const timeout = setTimeout(() => {
                handleStopBtnOne(i);
              }, i * 500);
              timeoutsRef.current.push(timeout);
            }
          }}
          sx={{
            minWidth: '0',
            padding: '0',
            position: 'absolute',
            width: '4%',
            height: '5%',
            fontSize: '1cqw',
            top: '95%',
            left: '8%',
          }}
        >
          DừngAll
        </Button>
        {/* <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={handleSaveResults}
          sx={{
            minWidth: '0',
            padding: '0',
            position: 'absolute',
            width: '4%',
            height: '5%',
            fontSize: '1cqw',
            top: '95%',
            left: '12%',
          }}
        >
          Lưu KQ
        </Button> */}
        {Array.from({ length: 2 }).map((_, index) => (
          <Button
            key={`start-${index}`}
            variant="contained"
            color="success"
            size="small"
            onClick={() => handleStartBtnOne(index)}
            sx={{
              minWidth: '0',
              padding: '0',
              position: 'absolute',
              zIndex: '2',
              width: '2%',
              height: '5%',
              fontSize: '1cqw',
              left: `${18 + (index * 3)}%`, // Stacking buttons horizontally
              top: '95%',
              display: !isPlaying[index] ? 'block' : 'none',
            }}
          >
            Q{index + 1}
          </Button>
        ))}

        {/* Render Dừng buttons */}
        {Array.from({ length: 2 }).map((_, index) => (
          <Button
            key={`stop-${index}`}
            variant="contained"
            color="error"
            size="small"
            disabled={!isPlaying[index]}
            onClick={() => handleStopBtnOne(index)}
            sx={{
              minWidth: '0',
              padding: '0',
              position: 'absolute',
              zIndex: '2',
              width: '2%',
              height: '5%',
              fontSize: '1cqw',
              left: `${18 + (index * 3)}%`, // Stacking buttons horizontally
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
        <div style={{ position: 'absolute', top: '95%', right: '10%', display: 'flex', alignItems: 'center', gap: '1cqw', zIndex: 2 }}>
          <label style={{ fontSize: '1cqw', color: 'black' }}>KQ đã lưu: {savedResults.length}</label>
        </div>
        <Button
          variant="contained"
          color="error"
          size="small"
          onClick={() => { setSavedResults([]) }}
          sx={{
            minWidth: '0',
            padding: '0',
            position: 'absolute',
            width: '4%',
            height: '2%',
            fontSize: '1cqw',
            top: '98%',
            right: '11%', 
          }}
        >
          Xóa
        </Button>
        <Button
          variant="contained"
          color="primary"
          size="small"
          disabled={isLoading}
          onClick={() => fetchConfig()}
          sx={{
            minWidth: '0',
            padding: '0',
            position: 'absolute',
            width: '8%',
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
