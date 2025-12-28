
import React, { useEffect } from 'react';
import { fabric } from 'fabric';
import { useEventGuiStore } from '@/zustand';
import { CanvasObject, SeatData, TicketCategory } from '@/types/data.types';

interface UseCanvasLoaderProps {
    canvas: fabric.Canvas | null;
    layout?: CanvasObject | null;
    readOnly: boolean;
    existingSeats?: any[];
    categories?: TicketCategory[];
    mergedStyle: any;
    onSeatClick?: (seat: SeatData) => void;
    setHasBgImage: (has: boolean) => void;
    onChange?: (json: CanvasObject) => void;
    onSave?: (json: CanvasObject) => void;
}

export const useCustomerCanvasLoaderSynced = ({
    canvas,
    layout,
    readOnly,
    existingSeats,
    categories,
    mergedStyle,
    onSeatClick,
    setHasBgImage,
    selectedSeatIds,
    onSelectionChange,
}: UseCanvasLoaderProps & { selectedSeatIds?: string[]; onSelectionChange?: (ids: string[], seats: SeatData[]) => void }) => {
    const { setRows } = useEventGuiStore();

    // Store props in refs to access latest values in event handlers without re-running effects
    const selectedSeatIdsRef = React.useRef(selectedSeatIds);
    const onSelectionChangeRef = React.useRef(onSelectionChange);

    useEffect(() => {
        selectedSeatIdsRef.current = selectedSeatIds;
    }, [selectedSeatIds]);

    useEffect(() => {
        onSelectionChangeRef.current = onSelectionChange;
    }, [onSelectionChange]);

    // Helper to create checkmark icon
    const createCheckmark = (left: number, top: number) => {
        const circle = new fabric.Circle({
            radius: 8,
            fill: '#4CAF50', // Green
            originX: 'center',
            originY: 'center',
            stroke: 'white',
            strokeWidth: 1
        });
        const text = new fabric.Text('✓', {
            fontSize: 12,
            fill: 'white',
            fontWeight: 'bold',
            originX: 'center',
            originY: 'center',
            top: 1 // slight offset for visual centering
        });
        const group = new fabric.Group([circle, text], {
            left: left,
            top: top,
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false,
            excludeFromExport: true, // Don't save this in JSON
            opacity: 0.6 // User Request: slightly transparent to see seat color
        });
        return group;
    };

    // Helper: Select Logic
    const selectSeat = (target: any, canvas: fabric.Canvas) => {
        if (target._customSelected) return; // Already selected

        target._customSelected = true;

        // Locate inner circle
        let targetCircle: fabric.Object | undefined = target;
        if (target.type === 'group') {
            const objects = (target as fabric.Group).getObjects();
            targetCircle = objects.find((o) => o.type === 'circle');
        }
        if (!targetCircle) return;

        // Save Original Stroke
        if (!target._originalStroke) target._originalStroke = targetCircle.stroke;

        // Highlight Border (Blue) on Inner Circle
        targetCircle.set({
            stroke: '#2196F3',
            strokeWidth: 3
        });

        // Add Checkmark Icon
        const center = target.getCenterPoint();
        const checkmark = createCheckmark(center.x, center.y);

        target._selectionIcon = checkmark;
        canvas.add(checkmark);
        canvas.bringToFront(checkmark);
    };

    // Helper: Deselect Logic
    const deselectSeat = (target: any, canvas: fabric.Canvas) => {
        if (!target._customSelected) return; // Already deselected

        target._customSelected = false;

        // Locate inner circle
        let targetCircle: fabric.Object | undefined = target;
        if (target.type === 'group') {
            const objects = (target as fabric.Group).getObjects();
            targetCircle = objects.find((o) => o.type === 'circle');
        }
        if (!targetCircle) return;

        // Restore Stroke on Inner Circle
        targetCircle.set({
            stroke: target._originalStroke || '#000000',
            strokeWidth: 1
        });

        // Remove Checkmark
        if (target._selectionIcon) {
            canvas.remove(target._selectionIcon);
            target._selectionIcon = null;
        }
    };

    // Sync visuals when selectedSeatIds prop changes (INWARD SYNC)
    useEffect(() => {
        if (!canvas || selectedSeatIds === undefined) return; // Only run if selectedSeatIds is explicitly provided

        const idsSet = new Set(selectedSeatIds);
        let needsRender = false;

        canvas.getObjects().forEach((obj: any) => {
            // Only process enabled seats for selection
            if (obj.customType === 'seat' && obj.id && obj.evented) {
                if (idsSet.has(obj.id)) {
                    if (!obj._customSelected) {
                        selectSeat(obj, canvas);
                        needsRender = true;
                    }
                } else {
                    if (obj._customSelected) {
                        deselectSeat(obj, canvas);
                        needsRender = true;
                    }
                }
            }
        });

        if (needsRender) {
            canvas.requestRenderAll();
        }
    }, [selectedSeatIds, canvas]); // Dependencies: selectedSeatIds and canvas

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
                // Key: canvasSeatId (which MUST match obj.id in Fabric)
                const seatMap =
                    existingSeats && Array.isArray(existingSeats) && existingSeats.length > 0
                        ? new Map(existingSeats.map((s) => [s.canvasSeatId, s]))
                        : null;

                // Create set of valid category IDs from the source of truth (API)
                const validCategoryIds = new Set(
                    (categories || []).map((c) => c.id.toString())
                );
                const categoryMap = new Map(
                    (categories || []).map((c) => [c.id.toString(), c])
                );

                canvas.getObjects().forEach((obj: any) => {
                    // Ensure ID exists for ALL objects
                    if (!obj.id) {
                        obj.id = Math.random().toString(36).substr(2, 9);
                    }

                    const isSeat = obj.customType === 'seat';
                    if (isSeat) {
                        let isInteractable = true;
                        let categoryId = obj.category;

                        // 1. Sync with DB Existing Seats (Priority 1: DB State)
                        if (seatMap && seatMap.has(obj.id)) {
                            const dbSeat = seatMap.get(obj.id);

                            // Hydrate from API
                            categoryId = dbSeat?.ticketCategoryId;
                            obj.status = dbSeat?.status || 'available';

                            // Update attributes for consistency
                            if (!obj.attributes) obj.attributes = {};
                            obj.attributes.number = dbSeat.seatNumber;
                            obj.attributes.status = obj.status;
                            obj.attributes.category = categoryId;

                        } else if (existingSeats && existingSeats.length > 0) {
                            // If existingSeats are provided (meaning we are in booking mode), 
                            // but this seat is NOT in the map -> It is invalid/orphaned or not configured.
                            // Disable it.
                            isInteractable = false;
                            obj.status = 'disabled';
                            categoryId = null; // Remove category visual so it doesn't look bookable
                        }

                        // 2. Further Validation: If status is not available, disable interaction
                        if (obj.status !== 'available') {
                            isInteractable = false;
                        }

                        // 3. Validate Category against API List (Source of Truth)
                        if (categoryId && !validCategoryIds.has(categoryId.toString())) {
                            // Invalid category -> treat as unavailable/disabled
                            categoryId = null;
                            if (isInteractable) {
                                obj.status = 'unavailable';
                                isInteractable = false;
                            }
                        }

                        // Apply final interactable state properties
                        obj.evented = isInteractable;
                        obj.selectable = false; // Always false for fabric selection, we use custom click
                        obj.hoverCursor = isInteractable ? 'pointer' : 'default';


                        // 4. Apply Visuals (Color)
                        if (categoryId && categoryMap.has(categoryId.toString())) {
                            const cat = categoryMap.get(categoryId.toString());
                            if (cat) {
                                obj.set('fill', cat.color);
                                obj.set('stroke', cat.color);
                                obj._originalStroke = cat.color;
                            }
                        } else {
                            // No category or Disabled -> Grey/Transparent
                            if (obj.status === 'booked' || obj.status === 'sold') {
                                obj.set('fill', '#bdbdbd'); // Sold/Booked visual
                                obj.set('stroke', '#9e9e9e');
                            } else if (obj.status === 'held') {
                                obj.set('fill', '#ffeb3b'); // Yellow for held? Or custom. Using grey for specific unmapped.
                                obj.set('stroke', '#fbc02d');
                            } else {
                                // Default disabled/unmapped
                                obj.set('fill', '#e0e0e0');
                                obj.set('stroke', '#bdbdbd');
                            }
                            obj._originalStroke = obj.stroke;
                        }
                    }
                });

                // Customer View Specific Logic
                // 1. Check for background image object and send to back
                const bgObj = canvas
                    .getObjects()
                    .find((obj: any) => obj.customType === 'layout-background');
                if (bgObj) {
                    setHasBgImage(true);
                    bgObj.sendToBack();
                    bgObj.set({
                        selectable: false,
                        evented: false, // Background not evented for customer to avoid interference
                        hasControls: false,
                        lockRotation: true,
                        lockMovementX: true,
                        lockMovementY: true,
                        hoverCursor: 'default',
                    });
                } else {
                    setHasBgImage(false);
                }

                // 2. Label each seat by number if enabled
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
                                excludeFromExport: true,
                            }
                        );
                        seat.labelObj = label;
                        canvas.add(label);
                        canvas.bringToFront(label);
                    });
                }

                // 3. STRICT CUSTOMER INTERACTION SETUP (V2)
                canvas.getObjects().forEach((obj: any) => {
                    const isSeat = obj.customType === 'seat';

                    if (isSeat && obj.type === 'group') {
                        // Find inner circle for visual handling
                        const objects = (obj as fabric.Group).getObjects();
                        const circle = objects.find((o) => o.type === 'circle');
                        if (circle) {
                            // Initialize original stroke from circle if not present
                            if (!obj._originalStroke) {
                                obj._originalStroke = circle.stroke || '#000000';
                            }
                            // Ensure circle stroke behavior is uniform
                            circle.set({ strokeUniform: true });
                        }
                    }

                    // Properties are generally set in the hydration loop above, but ensure locks here
                    obj.set({
                        hasControls: false,
                        hasBorders: false,
                        lockMovementX: true,
                        lockMovementY: true,
                        lockRotation: true,
                        lockScalingX: true,
                        lockScalingY: true,
                        lockSkewingX: true,
                        lockSkewingY: true,
                        permanentlyLocked: true,
                    });
                });

                // Initial Application of Selected Seat IDs (if any provided on mount)
                if (selectedSeatIds && selectedSeatIds.length > 0) {
                    const idsSet = new Set(selectedSeatIds);
                    canvas.getObjects().forEach((obj: any) => {
                        if (obj.customType === 'seat' && obj.id && idsSet.has(obj.id) && obj.evented) {
                            selectSeat(obj, canvas);
                        }
                    });
                }

                canvas.selection = false; // Disable global drag selection
                canvas.hoverCursor = 'default';

                // Custom Click Handler for Toggle Selection V2
                if (readOnlyMouseDownHandler) {
                    canvas.off('mouse:down', readOnlyMouseDownHandler);
                }

                readOnlyMouseDownHandler = (options) => {
                    if (!options.target) return;
                    const target = options.target as any;

                    // STRICT CHECK: Only allow click if seat is evented (interactable)
                    if (target.customType !== 'seat' || !target.evented) return;

                    // OUTWARD SYNC: Notify parent
                    const currentSelectedIdsProp = selectedSeatIdsRef.current;
                    const onSelectionChangeProp = onSelectionChangeRef.current;

                    const isControlled = currentSelectedIdsProp !== undefined;
                    const willBeSelected = !target._customSelected;

                    // Update Local Visuals ONLY if uncontrolled
                    if (!isControlled) {
                        if (willBeSelected) {
                            selectSeat(target, canvas);
                        } else {
                            deselectSeat(target, canvas);
                        }
                        canvas.requestRenderAll();
                    }

                    // Always notify parent of the INTENT
                    if (onSelectionChangeProp) {
                        let currentIds = currentSelectedIdsProp || [];
                        if (!isControlled) {
                            currentIds = canvas.getObjects()
                                .filter((o: any) => o.customType === 'seat' && o._customSelected)
                                .map((o: any) => o.id);
                        }

                        let newIds: string[] = [];
                        if (willBeSelected) {
                            newIds = [...new Set([...currentIds, target.id])];
                        } else {
                            newIds = currentIds.filter(id => id !== target.id);
                        }

                        // Also gather full seat data
                        const selectedSeatsData = canvas.getObjects()
                            .filter((o: any) => newIds.includes(o.id) && o.customType === 'seat')
                            .map((o: any) => ({
                                id: String(o.id ?? ''),
                                number: o.attributes?.number ?? o.seatNumber ?? '',
                                price: o.attributes?.price ?? o.price ?? '',
                                category: o.attributes?.category ?? o.category ?? '',
                                status: o.attributes?.status ?? o.status ?? '',
                            }));

                        onSelectionChangeProp(newIds, selectedSeatsData);
                    }
                };
                canvas.on('mouse:down', readOnlyMouseDownHandler);
                canvas.renderAll();
            }
        );

        return () => {
            if (readOnlyMouseDownHandler) {
                canvas.off('mouse:down', readOnlyMouseDownHandler);
            }
        };
    }, [canvas, layout, mergedStyle, onSeatClick, categories, existingSeats, setRows, setHasBgImage]); // Logic for selectedSeatIds is in separate effect
};
