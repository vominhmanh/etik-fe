
import { useEffect } from 'react';
import { fabric } from 'fabric';
import { useEventGuiStore } from '@/zustand';
import { CanvasObject, SeatData, TicketCategory } from '@/types/data.types';
import { SERIALIZABLE_PROPERTIES } from '@/utils/constants';

interface UseCanvasLoaderProps {
    canvas: fabric.Canvas | null;
    layout?: CanvasObject | null;
    readOnly: boolean;
    existingSeats?: any[];
    categories?: TicketCategory[];
    mergedStyle: any;
    onSeatClick?: (seat: SeatData) => void;
    setSelectedSeat?: (seat: SeatData | null) => void;
    setHasBgImage: (has: boolean) => void;
    onChange?: (json: CanvasObject) => void;
    onSave?: (json: CanvasObject) => void;
}

export const useCustomerCanvasLoader = ({
    canvas,
    layout,
    readOnly,
    existingSeats,
    categories,
    mergedStyle,
    onSeatClick,
    setSelectedSeat,
    setHasBgImage,
}: UseCanvasLoaderProps) => {
    const { setRows } = useEventGuiStore();

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
                                obj.set('stroke', cat.color);
                            }
                        } else {
                            obj.set('fill', 'transparent');
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
                            }
                        );
                        seat.labelObj = label;
                        canvas.add(label);
                        canvas.bringToFront(label);
                    });
                }

                // 3. STRICT CUSTOMER INTERACTION SETUP
                canvas.getObjects().forEach((obj: any) => {
                    // Strict check for seats
                    const isSeat = obj.customType === 'seat';

                    obj.set({
                        // User Request: "click is seat is selected... click one more time to deselect... select multiple"
                        // To achieve "Click to Toggle" without modifier keys, we disable defaults and handle manually.
                        selectable: false, // Disable default Fabric click-to-select (which replaces selection)
                        hasControls: false,
                        hasBorders: true, // Borders will be shown when we manually set active
                        lockMovementX: true,
                        lockMovementY: true,
                        lockRotation: true,
                        lockScalingX: true,
                        lockScalingY: true,
                        lockSkewingX: true,
                        lockSkewingY: true,
                        permanentlyLocked: true,
                        evented: isSeat, // Only seats catch events
                        hoverCursor: isSeat ? 'pointer' : 'default',
                    });
                });

                canvas.selection = false; // Disable global drag selection
                canvas.hoverCursor = 'default';

                // Custom Click Handler for Toggle Selection
                if (readOnlyMouseDownHandler) {
                    canvas.off('mouse:down', readOnlyMouseDownHandler);
                }

                readOnlyMouseDownHandler = (options) => {
                    if (!options.target) return;
                    const target = options.target as any;

                    if (target.customType !== 'seat') return;

                    // Toggle Selection Logic
                    const activeObjects = canvas.getActiveObjects();
                    const isAlreadySelected = activeObjects.includes(target);

                    let newSelection = [...activeObjects];

                    if (isAlreadySelected) {
                        // Deselect
                        newSelection = newSelection.filter(o => o !== target);
                    } else {
                        // Select
                        newSelection.push(target);
                    }

                    if (newSelection.length === 0) {
                        canvas.discardActiveObject();
                    } else if (newSelection.length === 1) {
                        canvas.setActiveObject(newSelection[0]);
                    } else {
                        const multiSelection = new fabric.ActiveSelection(newSelection, {
                            canvas: canvas,
                            lockMovementX: true,
                            lockMovementY: true,
                            hasControls: false, // Ensure the group itself has no controls
                        });
                        canvas.setActiveObject(multiSelection);
                    }

                    canvas.requestRenderAll();

                    // Optional callback if needed, but we removed setSelectedSeat call for modal
                    const seatData: SeatData = {
                        id: String(target.id ?? ''),
                        number: target.attributes?.number ?? target.seatNumber ?? '',
                        price: target.attributes?.price ?? target.price ?? '',
                        category: target.attributes?.category ?? target.category ?? '',
                        status: target.attributes?.status ?? target.status ?? '',
                    };

                    if (onSeatClick) {
                        onSeatClick(seatData);
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
    }, [canvas, layout, mergedStyle, onSeatClick, categories, existingSeats]);
};
