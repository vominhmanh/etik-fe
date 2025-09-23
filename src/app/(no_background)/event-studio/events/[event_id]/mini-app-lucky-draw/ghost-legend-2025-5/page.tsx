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
  const [initials, setInitials] = useState(Array(5).fill(true));
  const [data, setData] = useState<TransactionECodeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedComponents, setSelectedComponents] = useState<Record<string, SelectedComponent>>({});
  const [componentSettings, setComponentSettings] = useState<Record<string, ComponentSettings>>({});
  const [imagePreview, setImagePreview] = useState<string>();
  const [isPlaying, setIsPlaying] = useState(Array(5).fill(false));
  const [intervals, setIntervals] = useState(Array(5).fill(0.05)); // For 3 reveals, initially set to 0.1 each
  const [durations, setDurations] = useState(Array(5).fill(Infinity)); // For 3 reveals, initially set to 0.1 each
  const [results, setResults] = useState<(string | null)[]>(Array(5).fill(null)); // For 3 reveals, initially set to 0.1 each
  const [savedResults, setSavedResults] = useState<(string | null)[]>([]); // For 3 reveals, initially set to 0.1 each
  const [formValues, setFormValues] = React.useState<GetLuckyDrawConfigResponse>({
    listType: '',
    customDrawList: [],
  });
  const [originalList, setOriginalList] = useState<string[]>();
  const [drawList, setDrawList] = useState<string[]>();
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

    const newIntervals = Array(5).fill(0.05); // Set all intervals to 0.05 initially
    const newPlaying = Array(5).fill(true); // Set all intervals to 0.05 initially
    const newInitials = Array(5).fill(false); // Set all intervals to 0.05 initially
    const newDurations = Array(5).fill(Infinity); // Set all intervals to 0.05 initially
    // setDrawList(originalList)
    setIntervals(newIntervals);
    setIsPlaying(newPlaying);
    setInitials(newInitials);
    setDurations(newDurations);
    setCurrentRevealIndex(0); // Start from the first reveal
  };

  // Handle Stop button: set individual intervals and stop after 3 seconds
  const handleStopBtn = () => {
    if (currentRevealIndex < 5) {
      const newIntervals = [...intervals];
      newIntervals[currentRevealIndex] = 0.2; // Set the current reveal to 0.3
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
    // if (!drawList || !originalList) return;

    // Get only non-null results to avoid duplicate picking

    setResults((prev) => {
      if (!isPlaying[index]) {
        return prev;
      }

      const usedResults = [
        ...prev.filter((r) => r !== null),
        ...savedResults.filter((r) => r !== null),
      ] as string[];

      // Exclude first item from selection
      const customListWithoutFirst = formValues.customDrawList.slice(1);

      const remaining = customListWithoutFirst.filter(
        (name) => !usedResults.includes(name)
      );

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


  const handleStopBtn1 = (index: number) => {
    // if (!drawList || !originalList) return;

    // Get only non-null results to avoid duplicate picking

    setResults((prev) => {
      if (!isPlaying[index]) {
        return prev;
      }
    
      if (formValues.customDrawList.length === 0) {
        const updated = [...prev];
        updated[index] = null;
        return updated;
      }
    
      const firstChoice = formValues.customDrawList[0];
      let selected: string | null = null;
    
      if (!savedResults.includes(firstChoice)) {
        selected = firstChoice;
      } else {
        const remainingChoices = formValues.customDrawList
          .slice(1) // Exclude the first item
          .filter((item) => !savedResults.includes(item)); // Exclude saved items
    
        selected =
          remainingChoices.length === 0
            ? null
            : remainingChoices[Math.floor(Math.random() * remainingChoices.length)];
      }
    
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
    return Array.from({ length: 5 }, (_, index) => (
      <div
        key={index}
        className={`text-white fw-bold text-decoration-italic ${titillium.className}`}
        style={{
          fontWeight: 800,
          position: 'absolute',
          zIndex: 2,
          textAlign: 'center',
          color: 'white',
          fontSize: '1.6cqw',
          whiteSpace: 'nowrap',
          textShadow: '0 0 5% black',
          top: `${55.4 + (index % 5) * 7.7}%`,
          left: '33.5%',
          width: '32%',
          fontStyle: 'italic',
        }}
      >
        <RandomReveal
          isPlaying={isPlaying[index]} // Only reveal if current index is less or equal
          duration={durations[index]}
          updateInterval={intervals[index]} // Dynamic interval based on state
          characterSet={initials[index] ? [``] : formValues.customDrawList}
          characters={[<span key={index}>{results[index]}</span>]}
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
        <video
          ref={backgroundVideoRef}
          // autoPlay
          // loop
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
            src="https://media.etik.vn/lucky_wheel_ghost_legend_2025_5_background.webm"
            type="video/webm"
          />
          Your browser does not support the video tag.
        </video>
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
              setInitials(Array(5).fill(true));
              setResults(Array(5).fill(null));
              setDurations(Array(5).fill(Infinity)); // Set all intervals to 0.05 initially

              return Array(5).fill(true)

            });
            // Then stop all after a short timeout (e.g. 100ms)
            setTimeout(() => {
              setIsPlaying(Array(5).fill(false));
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

            for (let i = 0; i < 5; i++) {
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
        {Array.from({ length: 5 }).map((_, index) => (
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
              left: `${18 + (index * 3)}%`, // Stacking buttons vertically
              top: '95%',
              display: !isPlaying[index] ? 'block' : 'none',
            }}
          >
            Q{index + 1}
          </Button>
        ))}

        {/* Render Dừng buttons */}
        {Array.from({ length: 5 }).map((_, index) => (
          <Button
            key={`stop-${index}`}
            variant="contained"
            color="error"
            size="small"
            disabled={!isPlaying[index]}
            onClick={() => index == 0 ? handleStopBtn1(index) : handleStopBtnOne(index)}
            sx={{
              minWidth: '0',
              padding: '0',
              position: 'absolute',
              zIndex: '2',
              width: '2%',
              height: '5%',
              fontSize: '1cqw',
              left: `${18 + (index * 3)}%`, // Stacking buttons vertically
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
