
import { useEffect, useState } from 'react';
import { fabric } from 'fabric';
import { useEventGuiStore } from '@/zustand';
import { CanvasObject, SeatData, TicketCategory } from '@/types/data.types';
import { applyCustomStyles } from '../components/createObject/applyCustomStyles';
import { SERIALIZABLE_PROPERTIES } from '@/utils/constants';

interface UseCanvasLoaderProps {
    canvas: fabric.Canvas | null;
    layout?: CanvasObject | null;
    readOnly: boolean;
    existingSeats?: any[];
    categories?: TicketCategory[];
    mergedStyle: any;
    onSeatClick?: (seat: SeatData) => void;
    setSelectedSeat: (seat: SeatData | null) => void;
    setHasBgImage: (has: boolean) => void;
    onChange?: (json: CanvasObject) => void;
    onSave?: (json: CanvasObject) => void;
}

export const useCanvasLoader = ({
    canvas,
    layout,
    readOnly,
    existingSeats,
    categories,
    mergedStyle,
    onSeatClick,
    setSelectedSeat,
    setHasBgImage,
    onChange,
    onSave,
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

                    const isSeat = obj.customType === 'seat';
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

                        // Priority 1: Status Overrides (Sold/Held/Booked)
                        if (obj.status === 'booked' || obj.status === 'sold' || obj.status === 'held') {
                            // Define styles
                            let fillColor = '#e0e0e0';
                            let strokeColor = '#bdbdbd';
                            let iconPath = '';

                            if (obj.status === 'booked' || obj.status === 'sold') {

                                iconPath = 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'; // User
                            } else if (obj.status === 'held') {
                                iconPath = 'M6 2v6h.01L6 8.01 10 12l-4 4 .01.01H6V22h12v-5.99h-.01L18 16l-4-4 4-3.99-.01-.01H18V2H6z'; // Hourglass
                            }

                            // Apply styles
                            if (obj.type === 'group') {
                                const group = obj as fabric.Group;

                                // 1. Apply Color to Inner Circle
                                const circle = group.getObjects().find((o: any) => o.type === 'circle') as any;
                                if (circle) {
                                    circle.set('fill', fillColor);
                                    circle.set('stroke', strokeColor);
                                }
                                // Ensure group itself doesn't have a fill that blocks visual
                                group.set('fill', 'transparent');

                                // 2. Handle Icon
                                // Remove existing status icons first
                                const existingIcons = group.getObjects().filter((o: any) => o.name === 'status_icon');
                                existingIcons.forEach((icon: any) => group.remove(icon));

                                if (iconPath) {
                                    const path = new fabric.Path(iconPath, {
                                        fill: '#9d9b9bff',
                                        scaleX: 0.5,
                                        scaleY: 0.5,
                                        originX: 'center',
                                        originY: 'center',
                                        name: 'status_icon',
                                        opacity: 0.5,
                                        shadow: new fabric.Shadow({ color: 'rgba(255,255,255,0.2)', blur: 1 })
                                    });

                                    if (circle) {
                                        const radius = circle.radius || 10;
                                        const iconSize = Math.max(path.width || 0, path.height || 0);
                                        if (iconSize > 0) {
                                            const targetSize = radius * 1.2;
                                            const scale = targetSize / iconSize;
                                            path.set({ scaleX: scale, scaleY: scale });
                                        }
                                        path.set({ left: circle.left, top: circle.top });
                                    }
                                    group.add(path);
                                    group.addWithUpdate();
                                }
                            } else {
                                // Simple Object (Circle)
                                obj.set('fill', fillColor);
                                obj.set('stroke', strokeColor);
                            }
                            obj._originalStroke = strokeColor;
                        }
                        // Priority 2: Category Color (Available Seats)
                        else if (categoryId && categoryMap.has(categoryId.toString())) {
                            const cat = categoryMap.get(categoryId.toString());
                            if (cat) {
                                obj.set('fill', cat.color);
                                obj.set('stroke', cat.color); // Optional: sync stroke? Usually fill is enough.

                                // Clean up any status icons that might be there from a previous state/toggle
                                if (obj.type === 'group') {
                                    const group = obj as fabric.Group;
                                    const existingIcons = group.getObjects().filter((o: any) => o.name === 'status_icon');
                                    existingIcons.forEach((icon: any) => group.remove(icon));
                                }
                                obj._originalStroke = cat.color;
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
                    const bgObj = canvas
                        .getObjects()
                        .find((obj: any) => obj.customType === 'layout-background');
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
                        obj.evented = obj.customType === 'seat';
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
                            obj.customType === 'seat' ||
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

                    // Minimal state sync for SeatPicker
                    const bgObj = canvas
                        .getObjects()
                        .find((obj: any) => obj.customType === 'layout-background');
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
    }, [canvas, layout, readOnly, mergedStyle, onSeatClick, categories, existingSeats]);

    // Handle changes and save logic
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
};
