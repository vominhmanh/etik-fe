
import React, { useEffect } from 'react';
import { fabric } from 'fabric';
import { useEventGuiStore } from '@/zustand';
import { CanvasObject, SeatData, CategoryInfo, Layout, SeatObject, SeatStatus, ObjectProperties, ShowSeat } from '@/types/data.types';
import { useSeatMetadata } from './useSeatMetadata';
import { applyEmptySeatStyle, applyDarkenStyle, updateSeatVisuals } from '../components/createObject/applyCustomStyles';

interface UseCanvasLoaderProps {
    canvas: fabric.Canvas | null;
    layout: Layout;
    readOnly: boolean;
    existingSeats: ShowSeat[];
    categories: CategoryInfo[];
    mergedStyle: any;
    onSeatClick?: (seat: SeatData) => void;
    setHasBgImage: (has: boolean) => void;
    onChange?: (json: Layout) => void;
    onSave?: (json: Layout) => void;
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
    const { setRows, rows } = useEventGuiStore();
    // Use seat metadata hook to get rowLabel lookup function
    const { getRowLabel } = useSeatMetadata(layout);

    // Store rows in ref to compare without adding to dependency array
    const rowsRef = React.useRef(rows);
    rowsRef.current = rows;

    // Store props in refs to access latest values in event handlers without re-running effects
    const selectedSeatIdsRef = React.useRef(selectedSeatIds);
    const onSelectionChangeRef = React.useRef(onSelectionChange);
    const getRowLabelRef = React.useRef(getRowLabel);
    // Refs for data to access in loadFromJSON callback without dependencies
    const existingSeatsRef = React.useRef(existingSeats);
    const categoriesRef = React.useRef(categories);

    useEffect(() => {
        existingSeatsRef.current = existingSeats;
    }, [existingSeats]);

    useEffect(() => {
        categoriesRef.current = categories;
    }, [categories]);

    useEffect(() => {
        selectedSeatIdsRef.current = selectedSeatIds;
    }, [selectedSeatIds]);

    useEffect(() => {
        onSelectionChangeRef.current = onSelectionChange;
    }, [onSelectionChange]);

    useEffect(() => {
        getRowLabelRef.current = getRowLabel;
    }, [getRowLabel]);

    // Helper function to enrich rowLabel for a seat object once
    const enrichSeatRowLabel = (obj: any) => {
        if (!obj || obj.customType !== 'seat') return;

        // Initialize attributes if not exists
        if (!obj.attributes) {
            obj.attributes = {};
        }

        // Only enrich if not already set
        if (!obj.attributes.rowLabel || obj.attributes.rowLabel === '-') {
            const raw = obj.toJSON ? obj.toJSON(['id', 'category', 'price', 'rowLabel', 'rowId', 'seatNumber', 'customType', 'status']) : {};
            let rowLabel = raw.rowLabel || obj.attributes.rowLabel;

            if (!rowLabel || rowLabel === '-') {
                const rowId = String(raw.rowId || obj.attributes.rowId || '');
                rowLabel = getRowLabelRef.current(rowId);
            }
            rowLabel = rowLabel || '-';

            // Store enriched rowLabel in object for reuse
            obj.attributes.rowLabel = rowLabel;
            obj.rowLabel = rowLabel;
        }
    };

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
        if (target._selectionIcon) {
            canvas.remove(target._selectionIcon);
            target._selectionIcon = null;
        }
    };

    // Helper: Sync Visuals (Color, Status)
    const syncVisuals = (canvasInstance: fabric.Canvas, currentSeats: ShowSeat[], currentCategories: CategoryInfo[]) => {
        const categoryMap = new Map(
            currentCategories.map((c) => [c.id, c])
        );

        // Create a Map for existing seats for O(1) lookup
        // Key: canvasSeatId, Value: ShowSeat
        const seatMap = new Map<string, ShowSeat>();
        currentSeats.forEach(s => {
            if (s.canvasSeatId) {
                seatMap.set(s.canvasSeatId, s);
            }
        });

        // Optimization: Use requestAnimationFrame to avoid blocking UI if processing takes time
        // However, for typical seat counts (up to few thousands), synchronous loop with Map is fast enough.
        // We stick to synchronous for immediate visual feedback, but Map is key.

        canvasInstance.getObjects().forEach((obj: any) => {
            // Ensure ID exists
            if (!obj.id) return;

            if (obj.customType === 'seat') {
                // 1. Reset UI
                applyEmptySeatStyle(obj);

                let categoryId = null;
                let status: SeatStatus = 'available';

                // Check DB Seat using Map O(1)
                const dbSeat = seatMap.get(obj.id);

                if (dbSeat && dbSeat.ticketCategoryId && currentCategories.map((c) => c.id).includes(dbSeat.ticketCategoryId)) {
                    categoryId = dbSeat.ticketCategoryId;
                    status = dbSeat.status || 'available';
                    const color = categoryMap.get(categoryId)?.color || '#ffffff';

                    // 2. Apply Visuals using shared function
                    if (obj.type === 'group') {
                        updateSeatVisuals(obj as fabric.Group, {
                            fill: color,
                            status: status
                        });
                    } else {
                        // Fallback
                        obj.set('fill', color);
                        if (status === 'blocked' || status === 'sold' || status === 'held') {
                            applyDarkenStyle(obj, color);
                        }
                    }
                } else {
                    applyEmptySeatStyle(obj);
                }
            }
        });
        canvasInstance.requestRenderAll();
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

    // Load layout (Runs only when layout object reference changes)
    useEffect(() => {
        if (!canvas || !layout) return;

        // Clear canvas
        canvas.clear();

        // Store handler reference so we can remove it
        let readOnlyMouseDownHandler: ((options: any) => void) | null = null;
        let layoutCanvas = layout.canvas;

        // Handle extended JSON with rows
        if ((layout as any).rows && Array.isArray((layout as any).rows)) {
            const newRows = (layout as any).rows;
            // Check if rows are actually different to avoid infinite loop
            const currentRowsJson = JSON.stringify(rowsRef.current);
            const newRowsJson = JSON.stringify(newRows);

            if (currentRowsJson !== newRowsJson) {
                setRows(newRows);
            }

            if ((layout as any).canvas) layoutCanvas = (layout as any).canvas;
        }

        canvas.loadFromJSON(
            layoutCanvas,
            () => {
                // Initial Sync using Refs (to avoid dependency on changing data)
                syncVisuals(canvas, existingSeatsRef.current, categoriesRef.current);

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
                        lockScalingX: true,
                        lockScalingY: true,
                        lockSkewingX: true,
                        lockSkewingY: true,
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
                    // Ensure ID exists for ALL objects
                    if (!obj.id) {
                        obj.id = Math.random().toString(36).substr(2, 9);
                    }

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
                // Enrich rowLabel for all selected seats when canvas loads
                if (selectedSeatIdsRef.current && selectedSeatIdsRef.current.length > 0) {
                    const idsSet = new Set(selectedSeatIdsRef.current);
                    canvas.getObjects().forEach((obj: any) => {
                        if (obj.customType === 'seat' && obj.id && idsSet.has(obj.id) && obj.evented) {
                            enrichSeatRowLabel(obj);
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
                    const currentCategories = categoriesRef.current; // Use ref in handler

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

                        // Enrich rowLabel once and store in fabric object, then gather full seat data
                        const selectedSeatsData = canvas.getObjects()
                            .filter((o: any) => newIds.includes(o.id) && o.customType === 'seat')
                            .map((o: any) => {
                                // Enrich rowLabel once using helper function
                                enrichSeatRowLabel(o);

                                // Extract data from enriched object
                                const raw = o.toJSON ? o.toJSON(['id', 'category', 'price', 'rowLabel', 'rowId', 'seatNumber', 'customType', 'status']) : {};
                                const attributes = o.attributes || {};
                                const category = attributes.category ?? o.category ?? raw.category ?? '';

                                return {
                                    id: String(o.id ?? ''),
                                    number: attributes.number ?? o.seatNumber ?? raw.number ?? raw.seatNumber ?? '',
                                    price: attributes.price ?? o.price ?? raw.price ?? '',
                                    rowLabel: o.rowLabel || attributes.rowLabel || raw.rowLabel || '-',
                                    category: category,
                                    status: attributes.status ?? o.status ?? raw.status ?? '',
                                    // Use currentCategories from closure/ref
                                    categoryInfo: currentCategories.find((c: any) => c.id === category) || {
                                        id: category,
                                        name: 'Unknown Category',
                                        price: 0,
                                        color: '#999999'
                                    },
                                };
                            });

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
    }, [canvas, layout, mergedStyle, onSeatClick, setRows, setHasBgImage]); // Removed: categories, existingSeats

    // Sync seats when data changes (runs efficiently without reloading layout)
    useEffect(() => {
        if (!canvas) return;
        syncVisuals(canvas, existingSeats, categories);
    }, [canvas, existingSeats, categories]);
};
