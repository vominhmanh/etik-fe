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
import { CanvasObject, SeatCanvasProps, SeatData, CategoryStats } from '@/types/data.types';
import Modal, { DefaultSeatModal } from './ui/Modal';
import { TicketCategoryModal } from './ui/TicketCategoryModal';
import { IconButton, Stack, Tooltip } from '@mui/material';
import { LuArmchair, LuTicket } from 'react-icons/lu';
import { applyCustomStyles } from './createObject/applyCustomStyles';

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

const SERIALIZABLE_PROPERTIES = [
  'id',
  'width',
  'height',
  'fill',
  'stroke',
  'strokeWidth',
  'angle',
  'opacity',
  'selectable',
  'evented',
  'hasControls',
  'lockMovementX',
  'lockMovementY',
  'lockRotation',
  'customType',
  'rowId',
  'seatNumber',
  'category',
  'status',
  'price',
  'fontSize',
  'fontWeight',
  'fontFamily',
  'seatData',
  'zoneData',
];



const EMPTY_OBJECT = {};

const SeatPicker: React.FC<SeatCanvasProps> = ({
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
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasParent = useRef<HTMLDivElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const { canvas, setCanvas, toolMode, setToolMode, toolAction, snapEnabled, zoomLevel, setRows } =
    useEventGuiStore();
  const [selectedSeat, setSelectedSeat] = useState<SeatData | null>(null);
  const [hasBgImage, setHasBgImage] = useState(false);
  const [bgOpacity] = useState(0.5); // Increased opacity for better visibility as object
  const [openTicketModal, setOpenTicketModal] = useState(false);
  const [categoryStats, setCategoryStats] = useState<Record<number, CategoryStats>>({});

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

  // Handle background image upload
  const handleBgImageUpload = async (file: File) => {
    let imageUrl: string | null = null;

    if (onUploadBackground) {
      try {
        imageUrl = await onUploadBackground(file);
      } catch (error) {
        console.error("Values to upload background image:", error);
      }
    }

    if (!imageUrl) {
      // Fallback to local base64 if no upload handler or upload failed
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setCanvasImage(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    } else {
      setCanvasImage(imageUrl);
    }
  };

  const setCanvasImage = (url: string) => {
    if (canvas) {
      // Remove existing background layout if any
      const existingBg = canvas
        .getObjects()
        .find((obj: any) => obj.customType === 'layout-background');
      if (existingBg) {
        canvas.remove(existingBg);
      }

      fabric.Image.fromURL(url, (img) => {
        img.set({
          opacity: bgOpacity,
          selectable: false, // Default locked
          evented: !readOnly, // Allow events if editable (so we can double click)
          hasControls: false,
          lockRotation: true,
          lockMovementX: true,
          lockMovementY: true,
          hoverCursor: 'default',
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
      }, { crossOrigin: 'anonymous' } as any);
    }
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

  // Sync validation of hasBgImage and lock status (BG & Zones) on readOnly change
  useEffect(() => {
    if (!canvas) return;

    const bgObj = canvas
      .getObjects()
      .find((obj: any) => obj.customType === 'layout-background');
    if (bgObj) setHasBgImage(true);
    else setHasBgImage(false);

    // Lock/Unlock Logic for BG and Zones
    canvas.getObjects().forEach((obj: any) => {
      if (
        obj.customType === 'layout-background' ||
        obj.customType === 'zone' ||
        obj.type === 'rect' ||
        obj.type === 'polygon' ||
        ((obj.type === 'i-text' || obj.type === 'text') && !obj.isRowLabel)
      ) {
        obj.set({
          selectable: false,
          evented: !readOnly,
          hasControls: false,
          lockRotation: true,
          lockMovementX: true,
          lockMovementY: true,
          hoverCursor: !readOnly ? 'default' : undefined,
        });
      }
    });

    canvas.requestRenderAll();
  }, [canvas, readOnly]);

  // Handle Background Image Interaction (Lock/Unlock)
  useEffect(() => {
    if (!canvas || readOnly) return;

    const handleDblClick = (opt: fabric.IEvent) => {
      const target = opt.target as any;
      if (
        target &&
        (target.customType === 'layout-background' ||
          target.customType === 'zone' ||
          target.type === 'rect' ||
          target.type === 'polygon' ||
          ((target.type === 'i-text' || target.type === 'text') && !target.isRowLabel))
      ) {
        target.set({
          selectable: true,
          evented: true,
          hasControls: true,
          lockMovementX: false,
          lockMovementY: false,
          lockRotation: false,
          hoverCursor: 'move',
        });
        canvas.setActiveObject(target);
        canvas.requestRenderAll();
      }
    };

    const handleSelectionChange = () => {
      canvas.getObjects().forEach((obj: any) => {
        if (
          (obj.customType === 'layout-background' ||
            obj.customType === 'zone' ||
            obj.type === 'rect' ||
            obj.type === 'polygon' ||
            ((obj.type === 'i-text' || obj.type === 'text') && !obj.isRowLabel)) &&
          canvas.getActiveObject() !== obj
        ) {
          obj.set({
            selectable: false,
            evented: true,
            hasControls: false,
            lockMovementX: true,
            lockMovementY: true,
            lockRotation: true,
            hoverCursor: 'default',
          });
        }
      });
      canvas.requestRenderAll();
    };

    canvas.on('mouse:dblclick', handleDblClick);
    canvas.on('selection:cleared', handleSelectionChange);
    canvas.on('selection:created', handleSelectionChange);
    canvas.on('selection:updated', handleSelectionChange);

    return () => {
      canvas.off('mouse:dblclick', handleDblClick);
      canvas.off('selection:cleared', handleSelectionChange);
      canvas.off('selection:created', handleSelectionChange);
      canvas.off('selection:updated', handleSelectionChange);
    };
  }, [canvas, readOnly]);

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
    let canvasData = layout;

    // Handle extended JSON with rows
    if ((layout as any).rows && Array.isArray((layout as any).rows)) {
      setRows((layout as any).rows);
      if ((layout as any).canvas) canvasData = (layout as any).canvas;
    }

    // Ensure objects exists to prevent crash
    if (!canvasData.objects) {
      canvasData = { ...canvasData, objects: [] };
    }



    canvas.loadFromJSON(
      canvasData,
      () => {
        // Create map if existing seats are provided
        const seatMap = existingSeats && Array.isArray(existingSeats) && existingSeats.length > 0
          ? new Map(existingSeats.map(s => [s.canvasSeatId, s]))
          : null;

        // Create set of valid category IDs from the source of truth (API)
        const validCategoryIds = new Set((categories || []).map(c => c.id.toString()));
        const categoryMap = new Map((categories || []).map(c => [c.id.toString(), c]));

        canvas.getObjects().forEach((obj: any) => {
          // Ensure ID exists for ALL objects
          if (!obj.id) {
            obj.id = Math.random().toString(36).substr(2, 9);
          }

          const isSeat = obj.type === 'circle' || obj.customType === 'seat';
          if (isSeat) {
            let categoryId = obj.category;

            // 1. Sync with DB Existing Seats (Priority 1: DB State)
            if (seatMap && seatMap.has(obj.id)) {
              const dbSeat = seatMap.get(obj.id);
              categoryId = dbSeat?.ticketCategoryId;
              obj.status = dbSeat?.status || 'available';
            }

            // 2. Validate Category against API List (Source of Truth)
            // If the resulting categoryId (from DB or JSON) is not in valid list, clear it.
            if (categoryId && !validCategoryIds.has(categoryId.toString())) {
              categoryId = null;
              obj.status = 'available'; // Reset status if category is invalid
            }

            // Apply validated properties
            obj.category = categoryId;
            if (obj.attributes) {
              obj.attributes.category = categoryId;
              obj.attributes.status = obj.status;
            }

            // 3. Apply Visuals (Color)
            if (categoryId && categoryMap.has(categoryId.toString())) {
              const cat = categoryMap.get(categoryId.toString());
              if (cat) {
                obj.set('fill', cat.color);
                obj.set('stroke', cat.color); // Optional: sync stroke? Usually fill is enough.
              }
            } else {
              // No category or Invalid category -> Transparent/Default
              obj.set('fill', 'transparent');
            }
          }
        });

        canvas.renderAll();

        if (readOnly) {
          // Check for background image object and send to back
          const bgObj = canvas.getObjects().find((obj: any) => obj.customType === 'layout-background');
          if (bgObj) {
            setHasBgImage(true);
            bgObj.sendToBack();
            bgObj.set({
              selectable: false,
              evented: !readOnly,
              hasControls: false,
              lockRotation: true,
              lockMovementX: true,
              lockMovementY: true,
              hoverCursor: 'default',
            });
          } else {
            setHasBgImage(false);
          }

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
              id: String(seat.id ?? ''),
              number: seat.attributes?.number ?? seat.seatNumber ?? '',
              price: seat.attributes?.price ?? seat.price ?? '',
              category: seat.attributes?.category ?? seat.category ?? '',
              status: seat.attributes?.status ?? seat.status ?? '',
            };

            if (onSeatClick) {
              onSeatClick(seatData);
            } else {
              setSelectedSeat(seatData);
            }
          };
          canvas.on('mouse:down', readOnlyMouseDownHandler);
          canvas.renderAll();
        } else {
          // Edit Mode - Logic from Toolbar.tsx handleOpenFile

          // Enable selection
          canvas.selection = true;

          canvas.getObjects().forEach((obj: any) => {
            if (
              obj.type === 'circle' ||
              obj.type === 'rect' ||
              obj.type === 'i-text'
            ) {
              applyCustomStyles(obj);
              // Force unlock to ensure editability
              obj.set({
                selectable: true,
                evented: true,
                lockMovementX: false,
                lockMovementY: false,
                lockRotation: false,
              });
            }
          });
          canvas.renderAll();

          // Minimal state sync for SeatPicker (not present in Toolbar but needed for UI state)
          const bgObj = canvas.getObjects().find((obj: any) => obj.customType === 'layout-background');
          if (bgObj) setHasBgImage(true);
          else setHasBgImage(false);
        }
      }
    );

    return () => {
      if (readOnlyMouseDownHandler) {
        canvas.off('mouse:down', readOnlyMouseDownHandler);
      }
    };
  }, [canvas, layout, readOnly, mergedStyle, onSeatClick, categories]);

  useEffect(() => {
    if (!canvas || readOnly) return;

    const handleCanvasChange = () => {
      if (onChange) {
        const json = {
          type: 'canvas',
          ...canvas.toJSON(SERIALIZABLE_PROPERTIES),
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



  useEffect(() => {
    if (!canvas || !categories) return;

    const categoryMap = new Map(categories.map((c) => [c.id.toString(), c.color]));

    let needsRender = false;
    canvas.getObjects().forEach((obj: any) => {
      // Check for seats (circles or groups) that have a category
      const category = obj.category;

      if (!category) return;

      const catId = category.toString();
      const newColor = categoryMap.get(catId);

      if (!newColor) {
        // Category might have been deleted, or seat has invalid category
        // Only reset if it HAD a category but now doesn't match any
        if (catId) {
          if (obj.type === 'circle') {
            obj.set({ fill: 'transparent', category: null });
            needsRender = true;
          } else if (obj.type === 'group') {
            // handle group reset if needed
            const group = obj as fabric.Group;
            const circle = group.getObjects().find((o: any) => o.type === 'circle');
            if (circle) {
              circle.set({ fill: 'transparent' });
              (group as any).set({ category: null });
              group.addWithUpdate();
              needsRender = true;
            }
          }
        }
        return;
      }

      const isAvailable = obj.status === 'available' || !obj.status;

      if (isAvailable) {
        if (obj.type === 'circle') {
          if (obj.fill !== newColor) {
            obj.set('fill', newColor);
            needsRender = true;
          }
        } else if (obj.type === 'group' && (obj.rowId || obj.seatNumber)) {
          // It's a seat group, find the inner circle
          const group = obj as fabric.Group;
          const circle = group.getObjects().find((o: any) => o.type === 'circle');
          if (circle && circle.fill !== newColor) {
            circle.set('fill', newColor);
            group.addWithUpdate(); // Needed to update group cache/display
            needsRender = true;
          }
        }
      }
    });

    if (needsRender) {
      canvas.requestRenderAll();
    }
  }, [canvas, categories]);

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
          </Stack>
        </div>
      )}

      {/* Main Content Area (Toolbar + Canvas) */}
      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden">
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
              categories,
              onSaveCategories,
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
              categories={categories}
              onSaveCategories={onSaveCategories}
            />
          ))}

        <div className="flex h-0 min-h-0 w-full flex-1 overflow-hidden relative">
          {/* Canvas Area */}
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
          {!readOnly && (renderSidebar ? renderSidebar() : <Sidebar categories={categories} />)}
        </div>
      </div>
      {/* Only show the default modal if renderSeatDetails is not provided */}
      {renderSeatDetails
        ? renderSeatDetails({
          seat: selectedSeat!,
          onClose: () => setSelectedSeat(null),
          onAction: handleSeatAction,
        })
        : defaultSeatDetails}

      <TicketCategoryModal
        open={openTicketModal}
        onClose={() => setOpenTicketModal(false)}
        categories={categories || []}
        onSave={(newCategories) => onSaveCategories?.(newCategories)}
        stats={categoryStats}
        createCategoryUrl={createCategoryUrl}
      />
    </div>
  );
};

export default SeatPicker;
