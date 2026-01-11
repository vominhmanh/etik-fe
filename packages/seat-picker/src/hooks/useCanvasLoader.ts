
import { useEffect, useState } from 'react';
import { fabric } from 'fabric';
import { useEventGuiStore } from '@/zustand';
import { SeatData, CategoryInfo, ShowSeat, ObjectProperties, Layout, SeatObject, SeatStatus } from '@/types/data.types';
import { applyCustomStyles, applyEmptySeatStyle, applyDarkenStyle, updateSeatVisuals, getDarkenColor } from '../components/createObject/applyCustomStyles';
import { SERIALIZABLE_PROPERTIES } from '@/utils/constants';

interface UseCanvasLoaderProps {
    canvas: fabric.Canvas | null;
    layout: Layout;
    readOnly: boolean;
    existingSeats: ShowSeat[];
    categories: CategoryInfo[];
    mergedStyle: any;
    onSeatClick?: (seat: SeatData) => void;
    setSelectedSeat: (seat: SeatData | null) => void;
    setHasBgImage: (has: boolean) => void;
    onChange?: (json: Layout) => void;
    onSave?: (json: Layout) => void;
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
        const layoutCanvas = layout.canvas;

        // Clear canvas
        canvas.clear();

        // Store handler reference so we can remove it
        let readOnlyMouseDownHandler: ((options: any) => void) | null = null;

        // Handle extended JSON with rows
        if ((layout as any).rows && Array.isArray((layout as any).rows)) {
            setRows((layout as any).rows);
            if ((layout as any).canvas) layout = (layout as any).canvas;
        }


        canvas.loadFromJSON(
            layoutCanvas,
            () => {
                const categoryMap = new Map(
                    categories.map((c) => [c.id, c])
                );

                canvas.getObjects().forEach((obj: any) => {
                    // Ensure ID exists for ALL objects
                    if (!obj.id) {
                        obj.id = Math.random().toString(36).substr(2, 9);
                    }

                    if (obj.customType === 'seat') {
                        // 1. Reset UI
                        applyEmptySeatStyle(obj);

                        let categoryId = null;
                        let status: SeatStatus = 'available';

                        // Check DB Seat
                        const dbSeat = existingSeats.find((s) => s.canvasSeatId === obj.id);
                        if (dbSeat && dbSeat.ticketCategoryId && categories.map((c) => c.id).includes(dbSeat.ticketCategoryId)) {
                            categoryId = dbSeat.ticketCategoryId;
                            status = dbSeat.status || 'available';
                            const categoryData = categoryMap.get(categoryId);
                            const color = categoryData?.color || 'rgba(209, 193, 193, 0.7)';

                            // Update Object Data with authoritative DB info
                            obj.category = categoryId;
                            obj.price = categoryData?.price || 0;
                            if (!obj.attributes) obj.attributes = {};
                            obj.attributes.category = categoryId;
                            obj.attributes.price = obj.price;

                            // 2. Apply Visuals using shared function
                            if (obj.type === 'group') {
                                updateSeatVisuals(obj as fabric.Group, {
                                    fill: color,
                                    status: status
                                });
                            } else {
                                // Fallback for single objects (though we mostly use groups now)
                                obj.set('fill', color);
                                // Ensure single objects are also darkened if needed
                                if (['blocked', 'sold', 'held'].includes(status)) {
                                    applyDarkenStyle(obj, color);
                                }
                            }
                        } else {
                            applyEmptySeatStyle(obj);
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
                        const catId = seat.attributes?.category ?? seat.category ?? '';
                        const categoryInfo = categories.find((c: any) => c.id === catId) || {
                            id: catId,
                            name: 'Unknown Category',
                            price: 0,
                            color: '#999999'
                        };
                        const seatNum = seat.attributes?.number ?? seat.seatNumber ?? '';
                        const price = categoryInfo.price;
                        const status = seat.attributes?.status ?? seat.status ?? '';
                        const rowLabel = seat.attributes?.rowLabel ?? seat.rowLabel ?? '';

                        const seatData: SeatData = {
                            id: seat.id ?? '',
                            number: seatNum,
                            rowLabel: rowLabel,
                            price: price,
                            category: catId,
                            status: status,
                            categoryInfo,
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
                } as unknown as Layout;
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
