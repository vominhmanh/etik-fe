import { useRef, useEffect, useState, useMemo } from 'react';
import { fabric } from 'fabric';

import { useEventGuiStore } from '@/zustand';
import useCanvasSetup from '@/hooks/useCanvasSetup';
// import useSelectionHandler from '@/hooks/useSelectionHandler';
// import useMultipleSeatCreator from '@/hooks/useMultipleSeatCreator';
// import useObjectDeletion from '@/hooks/useObjectDeletion';
// import useObjectCreator from '@/hooks/useObjectCreator';
// import useKeyboardShortcuts from '@/hooks/useKeyboardShortcuts';
// import useUndoRedo from '@/hooks/useUndoRedo';
import { useCustomerCanvasLoaderSynced } from '@/hooks/useCustomerCanvasLoaderSynced';
import useRowLabelRenderer from '@/hooks/useRowLabelRenderer';
import { LuX, LuList, LuMenu } from 'react-icons/lu';
import { useSeatMetadata } from '@/hooks/useSeatMetadata';
import '@/index.css';
import '@/fabricCustomRegistration';
import { CanvasObject, SeatCanvasProps, SeatData, CategoryStats } from '@/types/data.types';
import { EMPTY_OBJECT, SERIALIZABLE_PROPERTIES } from '@/utils/constants';
import { useCanvasBackground } from '@/hooks/useCanvasBackground';
import { useSeatAppearance } from '@/hooks/useSeatAppearance';

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

const defaultLabels = {
  buyButton: 'Buy Seat',
  cancelButton: 'Cancel',
  seatNumber: 'Seat Number',
  category: 'Category',
  price: 'Price',
  status: 'Status',
};

const CustomerSeatPicker: React.FC<SeatCanvasProps> = ({
  className = '',
  onChange,
  onSave,
  layout,
  readOnly = false,
  style = EMPTY_OBJECT,
  renderToolbar,
  renderSidebar,
  renderSeatDetails,
  onSeatClick,
  onSeatAction,
  labels = EMPTY_OBJECT,
  categories = [],
  onSaveCategories,
  existingSeats = [],
  createCategoryUrl,
  onUploadBackground,
  renderOverlay,
  selectedSeatIds,
  onSelectionChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasParent = useRef<HTMLDivElement>(null);

  const canvas = useEventGuiStore((state) => state.canvas);
  const setCanvas = useEventGuiStore((state) => state.setCanvas);
  const zoomLevel = useEventGuiStore((state) => state.zoomLevel);
  // Removed selectedSeat state for modal - Logic moved to multi-select via canvas
  const [openTicketModal, setOpenTicketModal] = useState(false);
  const [categoryStats, setCategoryStats] = useState<Record<number, CategoryStats>>({});

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

  // Pre-process lookups for efficient rendering
  const { getRowLabel } = useSeatMetadata(layout);

  // Memoize selectedSeats from selectedSeatIds - reuse enriched rowLabel from fabric object
  const selectedSeats: SeatData[] = useMemo(() => {
    if (!selectedSeatIds || !canvas || selectedSeatIds.length === 0) return [];

    return selectedSeatIds
      .map(seatId => {
        const obj = canvas.getObjects().find((o: any) => o.id === seatId && o.customType === 'seat') as any;
        if (!obj) return null;

        // Use toJSON to safely extract properties
        const raw = obj.toJSON(['id', 'category', 'price', 'rowLabel', 'rowId', 'seatNumber', 'customType', 'status']);

        const catId = raw.category || '';
        const categoryInfo = categories.find((c: any) => c.id === catId) || {
          id: catId,
          name: 'Unknown Category',
          price: 0,
          color: '#999999'
        };
        const seatNum = raw.seatNumber || raw.number || '?';
        const price = categoryInfo.price;

        return {
          id: obj.id ?? '',
          number: seatNum,
          rowLabel: raw.rowLabel || '-',
          price: price,
          category: catId,
          status: raw.status || '',
          // Additional fields for display
          categoryInfo,
        };
      })
      .filter((s) => s !== null) as Array<SeatData>;
  }, [selectedSeatIds, canvas]);

  useEffect(() => {
    if (openTicketModal && canvas) {
      const stats: Record<number, CategoryStats> = {};

      // Initialize stats for all categories
      categories?.forEach(cat => {
        stats[cat.id] = { id: cat.id, total: 0, booked: 0, pending: 0, locked: 0 };
      });

      canvas.getObjects().forEach((obj: any) => {
        if (obj.category) {
          const catId = Number(obj.category);
          if (stats[catId]) {
            stats[catId].total++;
            const status = obj.status || 'available';
            if (status === 'sold') stats[catId].booked++;
            else if (status === 'reserved') stats[catId].pending++;
            else if (status === 'hold') stats[catId].locked++;
          }
        } else if (obj.type === 'group' && (obj.rowId || obj.seatNumber)) {
          // Check inside groups if any
          // For now assuming group properties mirror seat properties at top level or we need to access inner seat
          // If group has category, it counts.
          const catId = Number(obj.category);
          if (catId && stats[catId]) {
            stats[catId].total++;
            const status = obj.status || 'available';
            if (status === 'sold') stats[catId].booked++;
            else if (status === 'reserved') stats[catId].pending++;
            else if (status === 'hold') stats[catId].locked++;
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
    seatNumberStyle: {
      ...defaultStyle.seatNumberStyle,
      ...(style as any).seatNumberStyle,
    },
    seatStyle: {
      ...defaultStyle.seatStyle,
      ...(style as any).seatStyle,
    },
  }), [style]);


  // Handle Ctrl+Scroll Zoom
  useEffect(() => {
    if (!canvas) return;

    const handleWheel = (opt: fabric.IEvent) => {
      const evt = opt.e as WheelEvent;
      if (evt.ctrlKey) {
        evt.preventDefault();
        evt.stopPropagation();

        const delta = evt.deltaY;
        let newZoom = zoomLevel;

        if (delta > 0) {
          // Zoom out
          newZoom = Math.max(zoomLevel - 10, 50);
        } else {
          // Zoom in
          newZoom = Math.min(zoomLevel + 10, 250);
        }

        if (newZoom !== zoomLevel) {
          useEventGuiStore.getState().setZoomLevel(newZoom);
        }
      }
    };

    canvas.on('mouse:wheel', handleWheel);

    return () => {
      canvas.off('mouse:wheel', handleWheel);
    };
  }, [canvas, zoomLevel]);

  // Hook: mobile pinch-to-zoom (transform-based, rAF-throttled)
  useEffect(() => {
    const parent = canvasParent.current;
    if (!parent) return;

    let startDist = 0;
    let startZoom = 100; // percent
    let rafId: number | null = null;
    let pending = false;
    let targetScale = 1;
    let isPinching = false;
    let startWrapperOffset = { x: 0, y: 0 };

    const wrapper = parent.firstElementChild as HTMLElement | null;
    if (wrapper) {
      // performance hints
      wrapper.style.willChange = 'transform';
      wrapper.style.transformOrigin = '0 0'; // default; will set per-pinch
    }
    parent.style.touchAction = 'none'; // helps prevent browser gestures

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      e.preventDefault();
      isPinching = true;

      const [t1, t2] = [e.touches[0], e.touches[1]];
      startDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const centerX = (t1.clientX + t2.clientX) / 2;
      const centerY = (t1.clientY + t2.clientY) / 2;

      // record starting zoom from store (percent)
      startZoom = useEventGuiStore.getState().zoomLevel ?? startZoom;

      // Compute center relative to wrapper (so transform-origin is correct)
      if (wrapper) {
        const rect = wrapper.getBoundingClientRect();
        startWrapperOffset = { x: centerX - rect.left, y: centerY - rect.top };
        // set transform origin in px so scaling is around touch center
        wrapper.style.transformOrigin = `${startWrapperOffset.x}px ${startWrapperOffset.y}px`;
      }

      // disable parent scrolling while pinching (we'll use transform to simulate zoom)
      parent.style.overflow = 'hidden';
    };

    const applyTransform = () => {
      if (!wrapper) return;
      // targetScale is absolute scale relative to 1 (1 = 100%)
      // compute scale factor as targetZoom / 100
      wrapper.style.transform = `scale(${targetScale}) translateZ(0)`; // translateZ to encourage GPU
      pending = false;
      rafId = null;
    };

    const scheduleUpdate = () => {
      if (!pending) {
        pending = true;
        rafId = requestAnimationFrame(applyTransform);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isPinching || e.touches.length !== 2) return;
      e.preventDefault();

      const [t1, t2] = [e.touches[0], e.touches[1]];
      const newDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const scale = newDist / startDist;
      let newZoom = startZoom * scale; // percent
      newZoom = Math.min(Math.max(newZoom, 20), 400); // clamp percent

      // set targetScale = newZoom / 100
      targetScale = newZoom / 100;

      // schedule rAF update (throttled)
      scheduleUpdate();
    };

    const onTouchEnd = (e: TouchEvent) => {
      // if fewer than 2 touches => pinch finished
      if (e.touches.length < 2 && isPinching) {
        isPinching = false;

        // finalize: compute final zoom from current transform (targetScale)
        const finalZoom = Math.round((targetScale * 100) * 100) / 100; // two decimals
        // write the final zoom to your store
        useEventGuiStore.getState().setZoomLevel(finalZoom);

        // Important: remove transform and set layout to match final zoom so subsequent interactions read natural sizes
        if (wrapper) {
          // Option A: if you want to keep transform approach, you can clear transform and update width/height
          // (here we compute desired width/height from mergedStyle and finalScale)
          const finalScale = targetScale;
          wrapper.style.transform = ''; // remove transform
          wrapper.style.transformOrigin = ''; // reset
          wrapper.style.willChange = ''; // cleanup if you want

          // update layout to match the final zoom (so future layout-based math is correct)
          // If mergedStyle.width/height are the unzoomed pixel sizes:
          if (typeof mergedStyle?.width === 'number' && typeof mergedStyle?.height === 'number') {
            wrapper.style.width = `${mergedStyle.width * finalScale}px`;
            wrapper.style.height = `${mergedStyle.height * finalScale}px`;
          }
        }

        // restore parent scrolling
        parent.style.overflow = '';
        // Cancel any pending rAF
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
          pending = false;
        }
      }
    };

    parent.addEventListener('touchstart', onTouchStart, { passive: false });
    parent.addEventListener('touchmove', onTouchMove, { passive: false });
    parent.addEventListener('touchend', onTouchEnd);
    parent.addEventListener('touchcancel', onTouchEnd);

    return () => {
      parent.removeEventListener('touchstart', onTouchStart);
      parent.removeEventListener('touchmove', onTouchMove);
      parent.removeEventListener('touchend', onTouchEnd);
      parent.removeEventListener('touchcancel', onTouchEnd);
      if (rafId) cancelAnimationFrame(rafId);
      if (wrapper) {
        wrapper.style.transform = '';
        wrapper.style.transformOrigin = '';
        wrapper.style.willChange = '';
      }
      parent.style.touchAction = '';
      parent.style.overflow = '';
    };
  }, [canvasParent, mergedStyle]); // note: avoid including zoomLevel so startZoom is read at pinch start

  // Handle zoom changes
  useEffect(() => {
    if (!canvas) return;

    // Fabric can throw if its internal canvas DOM elements are not ready (or after dispose)
    const anyCanvas = canvas as any;
    if (!anyCanvas.lowerCanvasEl || !anyCanvas.upperCanvasEl) return;

    const scale = zoomLevel / 100;
    try {
      canvas.setDimensions(
        {
          width: mergedStyle.width * scale,
          height: mergedStyle.height * scale,
        },
        { cssOnly: false }
      );
      canvas.setZoom(scale);
      canvas.requestRenderAll();
    } catch (err) {
      // Avoid crashing the app; next effect tick / re-init will apply correct dimensions.
      // eslint-disable-next-line no-console
      console.warn("[seat-picker] setDimensions failed (canvas not ready?)", err);
    }
  }, [canvas, zoomLevel, mergedStyle.width, mergedStyle.height]);

  useCanvasSetup(
    canvasRef,
    canvasParent,
    setCanvas,
    mergedStyle.width,
    mergedStyle.height,
    mergedStyle.backgroundColor,
    true, // Enables selection (for visual feedback) even in read-only mode
    false
  );
  // Removed editing/selection hooks to enforce "select-seat" only and disable row selection.
  // useSelectionHandler(canvas);
  // useMultipleSeatCreator(canvas, toolMode, setToolMode);
  useRowLabelRenderer(canvas);
  // useObjectDeletion(canvas, toolAction);
  // useObjectCreator(canvas, toolMode, setToolMode);
  // Canvas Loader Hook (Customer specific: strict read-only, hover pointers)
  useCustomerCanvasLoaderSynced({
    canvas,
    layout,
    readOnly,
    existingSeats,
    categories,
    mergedStyle,
    onSeatClick,
    setHasBgImage, // Pass the setter from useCanvasBackground
    onChange,
    onSave,
    selectedSeatIds,
    onSelectionChange,
  });

  // Seat Appearance Hook (Sync colors)
  useSeatAppearance(canvas, categories);

  const handleSeatAction = (action: string) => {
    // Legacy action handler
    if (onSeatAction) {
      // We don't have single selectedSeat state anymore
    }
  };

  // Fit and Center canvas on mount/layout change
  useEffect(() => {
    if (canvasParent.current && canvas) {
      const parent = canvasParent.current;
      // Delay to ensure content is rendered/sized
      const timer = setTimeout(() => {
        const { clientWidth, clientHeight } = parent;

        // Auto-fit logic
        const padding = 40;
        const availableWidth = clientWidth - padding;
        const availableHeight = clientHeight - padding;

        if (mergedStyle.width > 0 && mergedStyle.height > 0) {
          const scaleX = availableWidth / mergedStyle.width;
          const scaleY = availableHeight / mergedStyle.height;
          const scale = Math.min(scaleX, scaleY);

          let targetZoom = Math.floor(scale * 100);
          targetZoom = Math.min(targetZoom, 100); // Max 100%
          targetZoom = Math.max(targetZoom, 20);  // Min 20% to allow fitting large maps

          useEventGuiStore.getState().setZoomLevel(targetZoom);
        }

        // Check if scrolling is still needed (if forced min zoom makes it larger than parent)
        // We wait for the next tick for layout to update, but we can check based on targetZoom
        // However, standard margin-auto handles centering if it fits.
        // If it overflows, we try to center scroll. depends on resulting dimensions.
        // For simplicity, we keep the scroll logic but use a slightly longer delay or assume User can scroll if overflow.
        // The most important part "fit to wrapper" is handled by setZoomLevel.

      }, 100);
      return () => clearTimeout(timer);
    }
  }, [layout, canvas, mergedStyle.width, mergedStyle.height]);

  const handleRemoveSeat = (seatIdToRemove: string) => {
    if (!selectedSeatIds || !onSelectionChange) return;

    // Filter selectedSeats to remove the seat
    const newSelectedSeats = selectedSeats.filter(seat => seat.id !== seatIdToRemove);

    // Extract ids from filtered selectedSeats
    const newIds = newSelectedSeats.map((seat: SeatData) => seat.id || '').filter(Boolean);

    onSelectionChange(newIds, newSelectedSeats);
  };


  // Full screen handler
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);

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
      className={`relative flex h-[600px] w-full flex-row bg-gray-200 ${className}`}
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


      {/* Main Content Area (Toolbar + Canvas) */}
      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden" >

        <div className="flex h-0 min-h-0 w-full flex-1 overflow-hidden relative" >
          {/* Canvas Area */}
          < div
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

          {/* Mobile Panel Toggle & Overlay */}
          <button
            onClick={() => setIsMobilePanelOpen(true)}
            className="md:hidden absolute top-4 right-4 z-20 bg-white p-2 rounded-md shadow-md border border-gray-200 text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <LuList size={20} />
          </button>

          {isMobilePanelOpen && (
            <div
              className="absolute inset-0 bg-black/30 z-30 md:hidden backdrop-blur-[1px]"
              onClick={() => setIsMobilePanelOpen(false)}
            />
          )}

          {/* Right Panel: Legend & Selected List */}
          <div
            className={`
              w-48 md:w-56 bg-white border-l border-gray-200 flex flex-col h-full overflow-hidden shadow-sm z-40 transition-transform duration-300 ease-in-out
              absolute right-0 top-0 bottom-0 md:relative md:translate-x-0
              ${isMobilePanelOpen ? 'translate-x-0' : 'translate-x-full'}
            `}
          >

            {/* Legend Section */}
            <div className="p-3 border-b border-gray-100 flex-shrink-0 flex justify-between items-center">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ticket Categories</h3>
              <button onClick={() => setIsMobilePanelOpen(false)} className="md:hidden text-gray-400 hover:text-gray-600">
                <LuX size={16} />
              </button>
            </div>

            <div className="px-3 pb-3 border-b border-gray-100 flex-shrink-0">
              <div className="space-y-1">
                {categories.length > 0 ? (
                  categories.map(cat => (
                    <div key={cat.id} className="flex items-center text-xs py-0.5">
                      <div
                        className="w-3 h-3 rounded-full mr-2 shadow-sm border border-black/10 flex-shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-gray-700 font-medium truncate flex-1">{cat.name}</span>
                      <span className="text-gray-500 text-[10px] ml-2">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(cat.price))}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-gray-400 italic">No categories available</p>
                )}
              </div>
            </div>

            {/* Selected Seats Section */}
            <div className="flex-1 overflow-y-auto p-3">
              <h3 className="text-xs font-bold text-gray-500 mb-2 flex items-center justify-between uppercase tracking-wider">
                Ordered Tickets
                <span className="bg-blue-100 text-blue-700 py-0.5 px-1.5 rounded-full text-[10px]">{selectedSeats.length}</span>
              </h3>

              <div className="space-y-1.5">
                {selectedSeats.map((seat: SeatData) => {
                  const categoryInfo = categories.find(cat => cat.id === seat.category);

                  return (
                    <div key={seat.id} className="flex items-center p-2 bg-gray-50 rounded border border-gray-100 items-stretch group relative">
                      <div className="flex items-center justify-center mr-2">
                        <span
                          className="w-3 h-3 rounded-full shadow-sm border border-black/10"
                          style={{ backgroundColor: categoryInfo?.color || '#ccc' }}
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="text-xs font-medium text-gray-800">
                          <span className="font-bold text-gray-900">{seat.rowLabel}</span>-{seat.number}
                        </div>
                        <div className="text-[10px] text-gray-500 truncate">
                          {categoryInfo?.name || 'Unknown Category'}
                        </div>
                      </div>
                      <div className="flex items-center text-xs font-semibold text-gray-700 ml-2">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(seat.price))}
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleRemoveSeat(seat.id || '')}
                        className="ml-1 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title="Remove ticket"
                      >
                        <LuX size={14} />
                      </button>
                    </div>
                  );
                })}
                {selectedSeats.length === 0 && (
                  <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <span className="block mb-1 opacity-50 text-xl">🎫</span>
                    <span className="text-[10px]">No tickets selected</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerSeatPicker;
