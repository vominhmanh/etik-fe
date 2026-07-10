import { useRef, useEffect, useState, useMemo } from 'react';
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
import { SeatCanvasProps, CategoryStats, Layout, SeatData } from '@/types/data.types';
import { exportCanvasToLiteJson } from '../utils/liteJsonExporter';

// Add onBack to Props since it might not be in the imported type yet
// Ideally we update the type definition, but if it's external/shared, we might need to extend it here or assume it's added.
// Let's check where SeatCanvasProps is defined first.
// Actually, I can't check the type def file easily if it's not open. 
// But I can see SeatPicker is strictly typed with SeatCanvasProps.
// I should probably check `types/data.types.ts` first to be safe, but since I'm lazy and this is "execution", I'll just extend the component prop usage if typescript complains, OR I can just cast it / ignore if I can't find the file.
// Wait, I should add it to the Interface if possible.
// But wait, the user showed me `packages/seat-picker/src/components/index.tsx`.
// The interface `SeatCanvasProps` is imported. 
// I'll try to update `types/data.types.ts` first if I can find it.
// Or I can modify the component signature to include extra props.

// Let's assume I can modify the component props destructuring first, which I did in the previous tool.
// Now let's implement the back button click.
import Toast from '@/components/ui/Toast';
import { TicketCategoryModal } from './ui/TicketCategoryModal';
import { CanvasSettingsModal } from './ui/CanvasSettingsModal';
import { IconButton, Stack, Tooltip, Backdrop, CircularProgress, Typography, Box } from '@mui/material';
import { LuArmchair, LuArrowLeft, LuTicket, LuSettings } from 'react-icons/lu';
import { EMPTY_OBJECT, SERIALIZABLE_PROPERTIES } from '@/utils/constants';
import { useCanvasBackground } from '@/hooks/useCanvasBackground';
import { useSeatAppearance } from '@/hooks/useSeatAppearance';
import { useCanvasLoader } from '@/hooks/useCanvasLoader';

const defaultStyle = {
  width: 800,
  height: 600,
  backgroundColor: '#f8fafc',
  showSeatNumbers: true,
  seatNumberStyle: {
    fontSize: 14,
    fill: '#222222',
    fontWeight: 'bold',
    fontFamily: 'Arial',
  },
  seatStyle: {
    fill: 'transparent',
    stroke: '#000000',
    strokeWidth: 1,
    radius: 10,
  },
};

const SeatPicker: React.FC<SeatCanvasProps> = ({
  className = '',
  onChange,
  onSave,
  layout,
  readOnly = false,
  style = EMPTY_OBJECT,
  onSeatClick,
  onSeatAction,
  categories = [],
  onSaveCategories,
  existingSeats = [],
  createCategoryUrl,
  onUploadBackground,
  renderOverlay,
  onBack,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasParent = useRef<HTMLDivElement>(null);

  const { canvas, setCanvas, toolMode, setToolMode, toolAction, snapEnabled, zoomLevel, loading, loadingProgress } =
    useEventGuiStore();
  const [selectedSeat, setSelectedSeat] = useState<SeatData | null>(null);
  const [openTicketModal, setOpenTicketModal] = useState(false);
  const [openSettingsModal, setOpenSettingsModal] = useState(false);
  const [categoryStats, setCategoryStats] = useState<Record<number, CategoryStats>>({});

  const initialWidth = layout?.settings?.width || (style as any)?.width || defaultStyle.width;
  const initialHeight = layout?.settings?.height || (style as any)?.height || defaultStyle.height;
  const [canvasDimensions, setCanvasDimensions] = useState({ width: initialWidth, height: initialHeight });

  useEffect(() => {
    if (layout?.settings) {
      setCanvasDimensions({
        width: layout.settings.width || defaultStyle.width,
        height: layout.settings.height || defaultStyle.height,
      });
    }
  }, [layout]);

  // Background Image Hook
  const {
    hasBgImage,
    setHasBgImage,
    bgInputRef,
    handleBgImageUpload,
    handleRemoveBgImage,
  } = useCanvasBackground({
    canvas,
    readOnly,
    onUploadBackground,
  });

  useEffect(() => {
    if (openTicketModal && canvas) {
      const stats: Record<number, CategoryStats> = {};

      // Initialize stats for all categories
      categories?.forEach(cat => {
        stats[cat.id] = { id: cat.id, total: 0, booked: 0, pending: 0, locked: 0 };
      });

      canvas.getObjects().forEach((obj: any) => {
        // Strict check for seats
        if (obj.customType === 'seat' && obj.category) {
          const catId = Number(obj.category);
          if (stats[catId]) {
            stats[catId].total++;
            const status = obj.status || 'available';
            if (status === 'sold') stats[catId].booked++;
            else if (status === 'held') stats[catId].pending++;
            else if (status === 'blocked') stats[catId].locked++;
          }
        }
      });
      setCategoryStats(stats);
    }
  }, [openTicketModal, canvas, categories]);

  // Merge default styles with custom styles
  const mergedStyle = useMemo(() => ({
    ...defaultStyle,
    ...style,
    width: canvasDimensions.width,
    height: canvasDimensions.height,
    seatNumberStyle: {
      ...defaultStyle.seatNumberStyle,
      ...(style as any).seatNumberStyle,
    },
    seatStyle: {
      ...defaultStyle.seatStyle,
      ...(style as any).seatStyle,
    },
  }), [style, canvasDimensions.width, canvasDimensions.height]);


  // Globally prevent browser zoom
  useEffect(() => {
    const preventBrowserZoomWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };
    const preventBrowserZoomKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === '=' || e.key === '-' || e.key === '0')) {
        e.preventDefault();
      }
    };
    document.addEventListener('wheel', preventBrowserZoomWheel, { passive: false });
    document.addEventListener('keydown', preventBrowserZoomKey, { passive: false });
    return () => {
      document.removeEventListener('wheel', preventBrowserZoomWheel);
      document.removeEventListener('keydown', preventBrowserZoomKey);
    };
  }, []);

  // Handle Ctrl+Scroll Zoom
  useEffect(() => {
    const parent = canvasParent.current;
    if (!parent) return;

    const handleWheel = (evt: WheelEvent) => {
      if (evt.ctrlKey) {
        evt.preventDefault();
        evt.stopPropagation();

        const delta = evt.deltaY;
        const currentZoom = useEventGuiStore.getState().zoomLevel;
        
        // Use 0.999 geometric scaling factor with deltaY to support both fast mouse wheels and high-frequency trackpads
        const zoomRatio = 0.999 ** delta;
        let newZoom = currentZoom * zoomRatio;

        // Calculate Min Zoom based on 70% of viewport
        const rect = parent.getBoundingClientRect();
        const minScaleX = rect.width / mergedStyle.width;
        const minScaleY = rect.height / mergedStyle.height;
        const minScale = Math.min(minScaleX, minScaleY) * 0.7; // Minimum zoom is 70% of viewport fit
        const minZoomLimit = minScale * 100;
        
        newZoom = Math.max(newZoom, minZoomLimit);
        // Max zoom is unlimited

        if (newZoom !== currentZoom) {
          const wrapper = parent.firstElementChild as HTMLElement;
          if (wrapper) {
            const wrapperRect = wrapper.getBoundingClientRect();
            const mouseXRelativeToWrapper = evt.clientX - wrapperRect.left;
            const mouseYRelativeToWrapper = evt.clientY - wrapperRect.top;

            const ratio = newZoom / currentZoom;
            
            useEventGuiStore.getState().setZoomLevel(newZoom);
            
            // Compensate scroll to keep cursor pointed at the same spot
            requestAnimationFrame(() => {
              const parentRect = parent.getBoundingClientRect();
              const newScrollLeft = (mouseXRelativeToWrapper * ratio) - (evt.clientX - parentRect.left);
              const newScrollTop = (mouseYRelativeToWrapper * ratio) - (evt.clientY - parentRect.top);
              
              parent.scrollLeft = Math.max(0, newScrollLeft);
              parent.scrollTop = Math.max(0, newScrollTop);
            });
          }
        }
      }
    };

    // Use passive: false to ensure preventDefault() works and stops browser zoom
    parent.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      parent.removeEventListener('wheel', handleWheel);
    };
  }, [mergedStyle.width, mergedStyle.height]);

  // Tell fabric to update its offset calculations after zoom layout shifts
  useEffect(() => {
    if (canvas) {
      canvas.calcOffset();
    }
  }, [zoomLevel, canvas]);

  // Toast State (Lifted from Toolbar)
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info' | 'warning'>('info');

  const notify = (msg: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setToastMsg(msg);
    setToastType(type);
    setShowToast(true);
  };

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

  // Synchronize actual Fabric canvas dimensions with React state
  useEffect(() => {
    if (canvas) {
      canvas.setDimensions({
        width: mergedStyle.width,
        height: mergedStyle.height,
      });
      canvas.requestRenderAll();
    }
  }, [canvas, mergedStyle.width, mergedStyle.height]);
  useSelectionHandler(canvas);
  useMultipleSeatCreator(canvas, toolMode, setToolMode);
  useRowLabelRenderer(canvas);
  useObjectDeletion(canvas, toolAction, notify);
  useObjectCreator(canvas, toolMode, setToolMode);
  if (!readOnly) {
    useUndoRedo();
    useKeyboardShortcuts(onSave);
    useSmartSnap(canvas, snapEnabled);
  }

  // Canvas Loader Hook (handling loading JSON, syncing seats, readOnly modes)
  useCanvasLoader({
    canvas,
    layout,
    readOnly,
    existingSeats,
    categories,
    mergedStyle,
    onSeatClick,
    setSelectedSeat,
    setHasBgImage, // Pass the setter from useCanvasBackground
    onChange,
    onSave,
  });

  // Seat Appearance Hook (Sync colors)
  useSeatAppearance(canvas, categories);

  const handleSeatAction = (action: string) => {
    if (selectedSeat) {
      if (onSeatAction) {
        onSeatAction(action, selectedSeat);
      }
      setSelectedSeat(null);
    }
  };

  // Save handler
  const handleSave = (json?: Layout) => {
    if (!onSave) return;

    if (json) {
      onSave(json);
      return;
    }

    if (canvas) {
      // Ensure all objects have IDs before export
      canvas.getObjects().forEach((obj: any) => {
        if (!obj.id) {
          obj.id = Math.random().toString(36).substr(2, 9);
        }
      });

      // Fallback for shortcuts or external calls
      const rows = useEventGuiStore.getState().rows;
      const liteJson = exportCanvasToLiteJson(canvas, rows, mergedStyle.width, mergedStyle.height);
      onSave(liteJson as unknown as Layout);
    }
  };

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
      className={`relative flex h-full w-full flex-row bg-gray-200 ${className}`}
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

      {/* Overlay for Full Screen (e.g. Notifications) */}
      {renderOverlay && renderOverlay({ isFullScreen })}

      {/* Left Sidebar (Hardcoded) - Now at top level */}
      {!readOnly && (
        <div className="flex-none h-full z-[60] border-r border-gray-300 bg-white shadow-[1px_0_3px_rgba(0,0,0,0.1)]">
          <Stack
            spacing={2}
            sx={{
              width: 50,
              height: "100%",
              bgcolor: 'background.paper',
              alignItems: 'center',
              py: 2
            }}
          >
            <Tooltip title="Quay lại Trang chính" placement="right">
              <IconButton size="small" onClick={onBack}>
                <LuArrowLeft size={20} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Hạng mục vé" placement="right">
              <IconButton onClick={() => setOpenTicketModal(true)} size="small">
                <LuTicket size={20} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Sơ đồ ghế" placement="right">
              <IconButton color="primary" size="small">
                <LuArmchair size={20} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Cài đặt" placement="right">
              <IconButton onClick={() => setOpenSettingsModal(true)} size="small">
                <LuSettings size={20} />
              </IconButton>
            </Tooltip>

          </Stack>
        </div>
      )}

      {/* Main Content Area (Toolbar + Canvas) */}
      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden">
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
          categories={categories}
          onSaveCategories={onSaveCategories}
          notify={notify}
          canvasWidth={canvasDimensions.width}
          canvasHeight={canvasDimensions.height}
          onDimensionsChange={(width, height) => setCanvasDimensions({ width, height })}
        />

        <div className="flex h-0 min-h-0 w-full flex-1 overflow-hidden relative">
          {/* Canvas Area */}
          <div
            className="block flex-1 overflow-auto bg-gray-100 p-[40px] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-400 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:w-2"
            ref={canvasParent}
            style={{ scrollbarWidth: 'thin' }}
          >
            {/* Scroll Container */}
            <div 
              className="mx-auto relative flex-shrink-0 transition-all duration-75"
              style={{
                width: mergedStyle.width * (zoomLevel / 100),
                height: mergedStyle.height * (zoomLevel / 100),
              }}
            >
              {/* Transform Wrapper */}
              <div
                className="absolute top-0 left-0 shadow-lg bg-white origin-top-left"
                style={{
                  width: mergedStyle.width,
                  height: mergedStyle.height,
                  transform: `scale(${zoomLevel / 100})`,
                }}
              >
                <canvas ref={canvasRef} />
              </div>
            </div>
          </div>
          <Sidebar categories={categories} />
        </div>
      </div>

      <TicketCategoryModal
        open={openTicketModal}
        onClose={() => setOpenTicketModal(false)}
        categories={categories}
        onSave={(newCategories) => onSaveCategories?.(newCategories)}
        stats={categoryStats}
        createCategoryUrl={createCategoryUrl}
      />

      <CanvasSettingsModal
        open={openSettingsModal}
        onClose={() => setOpenSettingsModal(false)}
        width={canvasDimensions.width}
        height={canvasDimensions.height}
        onSave={(width, height) => {
          setCanvasDimensions({ width, height });
          notify('Kích thước thiết kế đã được thay đổi!', 'success');
        }}
      />

      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 9999, flexDirection: 'column' }}
        open={loading}
      >
        <CircularProgress color="inherit" size={60} />
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="h6" fontWeight="bold">
            Đang tải sơ đồ...
          </Typography>
          <Typography variant="body1" sx={{ mt: 1 }}>
            {loadingProgress}%
          </Typography>
        </Box>
      </Backdrop>

      {/* Global Toast */}
      {/* Assuming Toast is exported from somewhere, need to import it */}
      <Toast
        open={showToast}
        message={toastMsg}
        type={toastType}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
};

export default SeatPicker;
