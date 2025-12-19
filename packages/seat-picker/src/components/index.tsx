import { useRef, useEffect, useState } from 'react';
import { fabric } from 'fabric';
import Toolbar from './toolbar';
import Sidebar from './sidebar';
import { useEventGuiStore } from '@/zustand';
import useCanvasSetup from '@/hooks/useCanvasSetup';
import useSelectionHandler from '@/hooks/useSelectionHandler';
import useMultipleSeatCreator from '@/hooks/useMultipleSeatCreator';
import useObjectDeletion from '@/hooks/useObjectDeletion';
import useObjectCreator from '@/hooks/useObjectCreator';
import useKeyboardShortcuts from '@/hooks/useKeyboardShortcuts';
import useUndoRedo from '@/hooks/useUndoRedo';
import { useSmartSnap } from '@/hooks/useSmartSnap';
import useRowLabelRenderer from '@/hooks/useRowLabelRenderer';
import '@/index.css';
import '../fabricCustomRegistration';
import { CanvasObject, SeatCanvasProps, SeatData } from '@/types/data.types';
import Modal, { DefaultSeatModal } from './ui/Modal';

const defaultStyle = {
  width: 800,
  height: 600,
  backgroundColor: '#f8fafc',
  showSeatNumbers: true,
  seatNumberStyle: {
    fontSize: 14,
    fill: '#222',
    fontWeight: 'bold',
    fontFamily: 'Arial',
  },
  seatStyle: {
    fill: 'transparent',
    stroke: 'black',
    strokeWidth: 1,
    radius: 10,
  },
};

const defaultLabels = {
  buyButton: 'Buy Seat',
  cancelButton: 'Cancel',
  seatNumber: 'Seat Number',
  category: 'Category',
  price: 'Price',
  status: 'Status',
};

const SeatPicker: React.FC<SeatCanvasProps> = ({
  className = '',
  onChange,
  onSave,
  layout,
  readOnly = false,
  style = {},
  renderToolbar,
  renderSidebar,
  renderSeatDetails,
  onSeatClick,
  onSeatAction,
  labels = {},
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasParent = useRef<HTMLDivElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const { canvas, setCanvas, toolMode, setToolMode, toolAction, snapEnabled, zoomLevel } =
    useEventGuiStore();
  const [selectedSeat, setSelectedSeat] = useState<SeatData | null>(null);
  const [hasBgImage, setHasBgImage] = useState(false);
  const [bgOpacity] = useState(0.5); // Increased opacity for better visibility as object

  // Merge default styles with custom styles
  const mergedStyle = {
    ...defaultStyle,
    ...style,
    seatNumberStyle: {
      ...defaultStyle.seatNumberStyle,
      ...style.seatNumberStyle,
    },
    seatStyle: {
      ...defaultStyle.seatStyle,
      ...style.seatStyle,
    },
  };

  // Merge default labels with custom labels
  const mergedLabels = {
    ...defaultLabels,
    ...labels,
  };

  // Handle background image upload
  const handleBgImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (canvas) {
        // Remove existing background layout if any
        const existingBg = canvas
          .getObjects()
          .find((obj: any) => obj.customType === 'layout-background');
        if (existingBg) {
          canvas.remove(existingBg);
        }

        fabric.Image.fromURL(e.target?.result as string, (img) => {
          img.set({
            opacity: bgOpacity,
            selectable: !readOnly,
            evented: !readOnly,
            hasControls: true,
            lockRotation: true,
            // @ts-ignore
            customType: 'layout-background',
          });

          // Calculate scale to fit while maintaining aspect ratio
          const canvasRatio = canvas.width! / canvas.height!;
          const imgRatio = img.width! / img.height!;

          let scaleX, scaleY;
          if (imgRatio > canvasRatio) {
            // Image is wider than canvas
            scaleX = canvas.width! / img.width!;
            scaleY = scaleX;
          } else {
            // Image is taller than canvas
            scaleY = canvas.height! / img.height!;
            scaleX = scaleY;
          }

          img.scale(scaleX); // Uniform scaling

          // Center the image
          img.center();

          canvas.add(img);
          img.sendToBack();
          canvas.setActiveObject(img);
          canvas.renderAll();
          setHasBgImage(true);
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Remove background image
  const handleRemoveBgImage = () => {
    if (canvas) {
      const bgObj = canvas
        .getObjects()
        .find((obj: any) => obj.customType === 'layout-background');
      if (bgObj) {
        canvas.remove(bgObj);
        canvas.renderAll();
      }
      setHasBgImage(false);
    }
  };

  // Sync validation of hasBgImage and lock status on readOnly change
  useEffect(() => {
    if (!canvas) return;

    const bgObj = canvas
      .getObjects()
      .find((obj: any) => obj.customType === 'layout-background');

    if (bgObj) {
      setHasBgImage(true);
      bgObj.set({
        selectable: !readOnly,
        evented: !readOnly,
        hasControls: !readOnly,
      });
      canvas.requestRenderAll();
    } else {
      setHasBgImage(false);
    }
  }, [canvas, readOnly]);

  // Handle zoom changes
  useEffect(() => {
    if (!canvas) return;
    const scale = zoomLevel / 100;
    canvas.setDimensions(
      {
        width: mergedStyle.width * scale,
        height: mergedStyle.height * scale,
      },
      { cssOnly: false }
    );
    canvas.setZoom(scale);
    canvas.requestRenderAll();
  }, [canvas, zoomLevel, mergedStyle.width, mergedStyle.height]);

  useCanvasSetup(
    canvasRef,
    canvasParent,
    setCanvas,
    mergedStyle.width,
    mergedStyle.height,
    mergedStyle.backgroundColor,
    !readOnly,
    false
  );
  useSelectionHandler(canvas);
  useMultipleSeatCreator(canvas, toolMode, setToolMode);
  useRowLabelRenderer(canvas);
  useObjectDeletion(canvas, toolAction);
  useObjectCreator(canvas, toolMode, setToolMode);
  if (!readOnly) {
    useUndoRedo();
    useKeyboardShortcuts(onSave);
    useSmartSnap(canvas, snapEnabled);
  }

  // Load layout if provided
  useEffect(() => {
    if (!canvas || !layout) return;

    // Clear canvas
    canvas.clear();

    // Store handler reference so we can remove it
    let readOnlyMouseDownHandler: ((options: any) => void) | null = null;

    canvas.loadFromJSON(layout, () => {
      // Check for background image object and send to back
      const bgObj = canvas.getObjects().find((obj: any) => obj.customType === 'layout-background');
      if (bgObj) {
        setHasBgImage(true);
        bgObj.sendToBack();
        bgObj.set({
          selectable: !readOnly,
          evented: !readOnly,
          hasControls: !readOnly,
          lockRotation: true,
        });
      } else {
        setHasBgImage(false);
      }

      if (readOnly) {
        // Label each seat by number if enabled
        if (mergedStyle.showSeatNumbers) {
          canvas.getObjects('circle').forEach((seat: any) => {
            // Remove any previous label
            if (seat.labelObj) {
              canvas.remove(seat.labelObj);
              seat.labelObj = null;
            }
            const label = new fabric.Text(
              seat.attributes?.number?.toString() ||
              seat.seatNumber?.toString() ||
              '',
              {
                left:
                  (seat.left ?? 0) +
                  (seat.radius ?? mergedStyle.seatStyle.radius),
                top:
                  (seat.top ?? 0) +
                  (seat.radius ?? mergedStyle.seatStyle.radius),
                ...mergedStyle.seatNumberStyle,
                originX: 'center',
                originY: 'center',
                selectable: false,
                evented: false,
              }
            );
            seat.labelObj = label;
            canvas.add(label);
            canvas.bringToFront(label);
          });
        }

        // Make all objects not selectable/editable, only seats (circles) are clickable
        canvas.getObjects().forEach((obj: any) => {
          obj.selectable = false;
          obj.evented = obj.type === 'circle';
        });
        canvas.selection = false;

        // Add click handler for seats (read-only mode only)
        readOnlyMouseDownHandler = (options) => {
          if (!options.target || options.target.type !== 'circle') return;

          const seat = options.target as any;
          const seatData: SeatData = {
            number: seat.attributes?.number ?? seat.seatNumber ?? '',
            price: seat.attributes?.price ?? seat.price ?? '',
            category: seat.attributes?.category ?? seat.category ?? '',
            status: seat.attributes?.status ?? seat.status ?? '',
            currencySymbol:
              seat.attributes?.currencySymbol ?? seat.currencySymbol ?? '',
            currencyCode:
              seat.attributes?.currencyCode ?? seat.currencyCode ?? '',
            currencyCountry:
              seat.attributes?.currencyCountry ?? seat.currencyCountry ?? '',
          };

          if (onSeatClick) {
            onSeatClick(seatData);
          } else {
            setSelectedSeat(seatData);
          }
        };
        canvas.on('mouse:down', readOnlyMouseDownHandler);
      } else {
        // Remove any previous read-only handler
        if (readOnlyMouseDownHandler) {
          canvas.off('mouse:down', readOnlyMouseDownHandler);
        }
        // Enable selection and make objects selectable in edit mode
        canvas.selection = true;
        canvas.getObjects().forEach((obj: any) => {
          // Keep layout background behavior consistent
          if (obj.customType === 'layout-background') {
            obj.set({
              selectable: true,
              evented: true,
              hasControls: true
            });
            return;
          }

          obj.selectable = true;
          obj.evented = true;
        });
        // Debug log to check object properties
        console.log(
          'Edit mode objects:',
          canvas.getObjects().map((obj) => ({
            type: obj.type,
            selectable: obj.selectable,
            evented: obj.evented,
          }))
        );
      }
      canvas.renderAll();
    });

    // Cleanup: always remove the handler when effect cleans up
    return () => {
      if (readOnlyMouseDownHandler) {
        canvas.off('mouse:down', readOnlyMouseDownHandler);
      }
    };
  }, [canvas, layout, readOnly, mergedStyle, onSeatClick]);

  useEffect(() => {
    if (!canvas || readOnly) return;

    const handleCanvasChange = () => {
      if (onChange) {
        const json = {
          type: 'canvas',
          ...canvas.toJSON(['customType', 'seatData', 'zoneData']),
        } as unknown as CanvasObject;
        onChange(json);
      }
    };

    // Listen to all relevant canvas events
    const events = [
      'object:modified',
      'object:added',
      'object:removed',
      'object:moving',
      'object:scaling',
      'object:rotating',
      'object:skewing',
      'path:created',
      'selection:created',
      'selection:updated',
      'selection:cleared',
    ];

    events.forEach((event) => {
      canvas.on(event, handleCanvasChange);
    });

    return () => {
      events.forEach((event) => {
        canvas.off(event, handleCanvasChange);
      });
    };
  }, [canvas, onChange, readOnly]);

  const handleSeatAction = (action: string) => {
    if (selectedSeat) {
      if (onSeatAction) {
        onSeatAction(action, selectedSeat);
      }
      setSelectedSeat(null);
    }
  };

  // Save handler
  const handleSave = () => {
    if (!canvas || !onSave) return;

    const json = {
      type: 'canvas',
      ...canvas.toJSON(['customType', 'seatData', 'zoneData']),
    } as unknown as CanvasObject;

    onSave(json);
  };

  // Default seat details modal
  const defaultSeatDetails = (
    <DefaultSeatModal
      selectedSeat={selectedSeat}
      setSelectedSeat={setSelectedSeat}
      mergedLabels={mergedLabels}
      handleSeatAction={handleSeatAction}
    />
  );

  // Full screen handler
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
    };
  }, []);

  const handleToggleFullScreen = async () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      try {
        await containerRef.current.requestFullscreen();
      } catch (err) {
        console.error('Error attempting to enable full-screen mode:', err);
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex h-full w-full flex-col bg-gray-200 ${className} ${isFullScreen ? 'p-4' : ''
        }`}
    >
      <input
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        ref={bgInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleBgImageUpload(e.target.files[0]);
          }
        }}
      />
      {!readOnly &&
        (renderToolbar ? (
          renderToolbar({
            onSave: handleSave,
            onBgLayout: () => {
              if (hasBgImage) {
                handleRemoveBgImage();
              } else {
                bgInputRef.current?.click();
              }
            },
          })
        ) : (
          <Toolbar
            onSave={handleSave}
            onBgLayout={() => {
              if (hasBgImage) {
                handleRemoveBgImage();
              } else {
                bgInputRef.current?.click();
              }
            }}
            onToggleFullScreen={handleToggleFullScreen}
            isFullScreen={isFullScreen}
          />
        ))}
      <div className="flex h-0 min-h-0 w-full flex-1 overflow-hidden pt-12">
        <div
          className="flex flex-1 overflow-auto bg-gray-100 p-[2%] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-400 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar]:w-1"
          ref={canvasParent}
          style={{ scrollbarWidth: 'thin' }}
        >
          <div
            className="m-auto relative shadow-lg bg-white"
            style={{
              width: mergedStyle.width * (zoomLevel / 100),
              height: mergedStyle.height * (zoomLevel / 100),
            }}
          >
            <canvas ref={canvasRef} />
          </div>
        </div>
        {!readOnly && (renderSidebar ? renderSidebar() : <Sidebar />)}
      </div>
      {/* Only show the default modal if renderSeatDetails is not provided */}
      {renderSeatDetails
        ? renderSeatDetails({
          seat: selectedSeat!,
          onClose: () => setSelectedSeat(null),
          onAction: handleSeatAction,
        })
        : defaultSeatDetails}
    </div>
  );
};

export default SeatPicker;
