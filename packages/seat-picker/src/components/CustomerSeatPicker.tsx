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
import { useCustomerCanvasLoaderV2 } from '@/hooks/useCustomerCanvasLoaderV2';
import useRowLabelRenderer from '@/hooks/useRowLabelRenderer';
import { LuX } from 'react-icons/lu';
import { useSeatMetadata } from '../hooks/useSeatMetadata';
import '@/index.css';
import '../fabricCustomRegistration';
import { CanvasObject, SeatCanvasProps, SeatData, CategoryStats } from '@/types/data.types';
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
  categories,
  onSaveCategories,
  existingSeats,
  createCategoryUrl,
  onUploadBackground,
  renderOverlay,
  ticketCategories,
  selectedSeatIds,
  onSelectionChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasParent = useRef<HTMLDivElement>(null);

  const { canvas, setCanvas, zoomLevel } =
    useEventGuiStore();
  useEventGuiStore();
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
  const { getCategory, getRowLabel, displayCategories } = useSeatMetadata(layout || {}, ticketCategories);

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

  // Merge default labels with custom labels
  const mergedLabels = useMemo(() => ({
    ...defaultLabels,
    ...labels,
  }), [labels]);

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
  useCustomerCanvasLoaderV2({
    canvas,
    layout,
    readOnly,
    existingSeats,
    categories: ticketCategories || categories,
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

  // Save handler
  const handleSave = (json?: CanvasObject) => {
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
      const fabricJson = canvas.toJSON(SERIALIZABLE_PROPERTIES);
      const canvasJson = {
        type: 'canvas',
        rows,
        categories,
        canvas: fabricJson,
      } as unknown as CanvasObject;
      onSave(canvasJson);
    }
  };

  const handleRemoveSeat = (seatIdToRemove: string) => {
    if (!selectedSeatIds || !onSelectionChange || !canvas) return;

    const newIds = selectedSeatIds.filter(id => id !== seatIdToRemove);

    // Construct new SeatData list for callback consistency
    const newSelectedSeats = newIds.map(id => {
      const obj = canvas.getObjects().find((o: any) => o.id === id && o.customType === 'seat') as any;
      if (!obj) return null;
      return {
        id: String(obj.id ?? ''),
        number: obj.attributes?.number ?? obj.seatNumber ?? '',
        price: obj.attributes?.price ?? obj.price ?? '',
        category: obj.attributes?.category ?? obj.category ?? '',
        status: obj.attributes?.status ?? obj.status ?? '',
      };
    }).filter((s) => s !== null) as SeatData[];

    onSelectionChange(newIds, newSelectedSeats);
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

          {/* Right Panel: Legend & Selected List */}
          <div className="w-72 bg-white border-l border-gray-200 flex flex-col h-full overflow-hidden shadow-sm z-10 transition-all duration-300">

            {/* Legend Section */}
            <div className="p-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Ticket Categories</h3>
              <div className="space-y-2">
                {displayCategories.length > 0 ? (
                  displayCategories.map(cat => (
                    <div key={cat.id} className="flex items-center text-sm py-1">
                      <div
                        className="w-4 h-4 rounded-full mr-3 shadow-sm border border-black/10 flex-shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-gray-700 font-medium truncate flex-1">{cat.name}</span>
                      <span className="text-gray-500 text-xs ml-2">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(cat.price))}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 italic">No categories available</p>
                )}
              </div>
            </div>

            {/* Selected Seats Section */}
            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center justify-between">
                Ordered Tickets
                <span className="bg-blue-100 text-blue-700 py-0.5 px-2 rounded-full text-xs">{selectedSeatIds?.length || 0}</span>
              </h3>

              <div className="space-y-2">
                {selectedSeatIds?.map(seatId => {
                  // Resolve seat details from canvas
                  const canvasSeat = canvas?.getObjects().find((o: any) => o.id === seatId && o.customType === 'seat') as any;
                  if (!canvasSeat) return null;

                  // Use toJSON to safely extract properties that might be on the prototype or mixed in
                  const raw = canvasSeat.toJSON(['id', 'category', 'price', 'rowLabel', 'rowId', 'seatNumber', 'customType', 'status']);
                  const attributes = canvasSeat.attributes || {};

                  const catId = String(raw.category || attributes.category || '').trim();

                  // Optimized Lookup using Hook
                  const categoryInfo = getCategory(catId);

                  // Row Lookup using Hook
                  let rowLabel = raw.rowLabel || attributes.rowLabel;
                  if (!rowLabel || rowLabel === '-') {
                    const rowId = String(raw.rowId || attributes.rowId || '');
                    rowLabel = getRowLabel(rowId);
                  }
                  rowLabel = rowLabel || '-';

                  const seatNum = raw.seatNumber || attributes.number || raw.number || '?';
                  const price = raw.price !== undefined && raw.price !== "" ? Number(raw.price) : categoryInfo.price;

                  return (
                    <div key={seatId} className="flex items-center p-2 bg-gray-50 rounded border border-gray-100 items-stretch group relative">
                      <div className="flex items-center justify-center mr-3">
                        <span
                          className="w-4 h-4 rounded-full shadow-sm border border-black/10"
                          style={{ backgroundColor: categoryInfo.color }}
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="text-sm font-medium text-gray-800">
                          <span className="font-bold text-gray-900">Row {rowLabel}</span>, Seat {seatNum}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {categoryInfo.name}
                        </div>
                      </div>
                      <div className="flex items-center text-sm font-semibold text-gray-700 ml-2">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(price))}
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleRemoveSeat(seatId)}
                        className="ml-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title="Remove ticket"
                      >
                        <LuX size={16} />
                      </button>
                    </div>
                  );
                })}
                {(!selectedSeatIds || selectedSeatIds.length === 0) && (
                  <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <span className="block mb-1 opacity-50 text-2xl">🎫</span>
                    <span className="text-xs">No tickets selected</span>
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
