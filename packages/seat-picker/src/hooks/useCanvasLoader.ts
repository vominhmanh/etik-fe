
import { useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import { useEventGuiStore } from '@/zustand';
import { SeatData, CategoryInfo, ShowSeat, ObjectProperties, Layout, SeatObject, SeatStatus } from '@/types/data.types';
import { applyCustomStyles, applyEmptySeatStyle, applyDarkenStyle, updateSeatVisuals, getDarkenColor } from '../components/createObject/applyCustomStyles';
import { SERIALIZABLE_PROPERTIES } from '@/utils/constants';
import { exportCanvasToLiteJson } from '../utils/liteJsonExporter';
import { createSeat, createText, createRect } from '../components/createObject';

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

    const categoriesRef = useRef(categories);
    const existingSeatsRef = useRef(existingSeats);

    useEffect(() => {
        categoriesRef.current = categories;
        existingSeatsRef.current = existingSeats;
    }, [categories, existingSeats]);

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


        const onLoadComplete = () => {
            const categoryMap = new Map(
                categoriesRef.current.map((c) => [c.id.toString(), c])
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

                    const dbSeat = existingSeatsRef.current.find((s) => s.canvasSeatId === obj.id);
                    if (dbSeat && dbSeat.ticketCategoryId && categoryMap.has(dbSeat.ticketCategoryId.toString())) {
                        categoryId = dbSeat.ticketCategoryId;
                        status = dbSeat.status || 'available';

                        const categoryData = categoryMap.get(categoryId.toString());
                        const color = categoryData?.color || 'rgba(209, 193, 193, 0.7)';

                        // Update Object Data with authoritative DB info
                        obj.set({
                            category: categoryId,
                            price: categoryData?.price || 0,
                            status: status
                        });

                        // Also set property on object instance directly for safety
                        obj.category = categoryId;
                        obj.price = categoryData?.price || 0;
                        obj.status = status;

                        // 2. Apply Visuals using shared function
                        if (obj.type === 'group') {
                            updateSeatVisuals(obj as fabric.Group, {
                                fill: color,
                                status: status
                            });
                        } else {
                            // Fallback for single objects
                            obj.set('fill', color);
                            if (['blocked', 'sold', 'held'].includes(status)) {
                                applyDarkenStyle(obj, color);
                            }
                        }
                    } else {
                        const jsonSeat = layoutCanvas?.objects?.find((o: any) => o.id === obj.id);
                        if (jsonSeat) {
                            obj.category = jsonSeat.category;
                            obj.status = jsonSeat.status || 'available';
                            obj.price = jsonSeat.price || 0;
                        }
                        
                        if (obj.category && categoryMap.has(obj.category.toString())) {
                            const catData = categoryMap.get(obj.category.toString());
                            const color = catData?.color || 'rgba(209, 193, 193, 0.7)';
                            if (obj.type === 'group') {
                                updateSeatVisuals(obj as fabric.Group, { fill: color, status: obj.status });
                            } else {
                                obj.set('fill', color);
                                if (['blocked', 'sold', 'held'].includes(obj.status)) {
                                    applyDarkenStyle(obj, color);
                                }
                            }
                        } else {
                            applyEmptySeatStyle(obj);
                        }
                    }
                }
            });

            canvas.renderAll();

            if (readOnly) {
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

                if (mergedStyle.showSeatNumbers) {
                    canvas.getObjects('circle').forEach((seat: any) => {
                        if (seat.labelObj) {
                            canvas.remove(seat.labelObj);
                            seat.labelObj = null;
                        }
                        const label = new fabric.Text(
                            seat.seatNumber || '',
                            {
                                left: (seat.left ?? 0) + (seat.radius ?? mergedStyle.seatStyle.radius),
                                top: (seat.top ?? 0) + (seat.radius ?? mergedStyle.seatStyle.radius),
                                ...mergedStyle.seatNumberStyle,
                                originX: 'center', originY: 'center', selectable: false, evented: false,
                            }
                        );
                        seat.labelObj = label;
                        canvas.add(label);
                        canvas.bringToFront(label);
                    });
                }

                canvas.getObjects().forEach((obj: any) => {
                    obj.selectable = false;
                    obj.evented = obj.customType === 'seat';
                });
                canvas.selection = false;

                readOnlyMouseDownHandler = (options) => {
                    if (!options.target || (options.target.type !== 'circle' && options.target.type !== 'group')) return;
                    const seat = options.target as any;
                    if (seat.customType !== 'seat') return;
                    
                    const catId = seat.category ?? 0;
                    const categoryInfo = categoriesRef.current.find((c: any) => c.id === catId) || {
                        id: catId, name: 'Unknown Category', price: 0, color: '#999999'
                    };
                    const seatNum = seat.seatNumber ?? '';
                    const price = categoryInfo.price;
                    const status = seat.status ?? '';
                    const rowLabel = seat.rowLabel ?? '';

                    const seatData: SeatData = {
                        id: seat.id ?? '', number: seatNum, rowLabel: rowLabel, price: price, category: catId, status: status, categoryInfo,
                    };

                    if (onSeatClick) onSeatClick(seatData);
                    else setSelectedSeat(seatData);
                };
                canvas.on('mouse:down', readOnlyMouseDownHandler);
                canvas.renderAll();
            } else {
                canvas.selection = true;
                canvas.getObjects().forEach((obj: any) => {
                    if (obj.customType === 'seat' || obj.type === 'rect' || obj.type === 'i-text' || obj.type === 'text') {
                        applyCustomStyles(obj);
                        obj.set({
                            selectable: true, evented: true, lockMovementX: false, lockMovementY: false, lockRotation: false,
                        });
                    }
                });
                canvas.renderAll();

                const bgObj = canvas.getObjects().find((obj: any) => obj.customType === 'layout-background');
                if (bgObj) setHasBgImage(true);
                else setHasBgImage(false);
            }
        };

        if ((layout as any).isLite) {
            const liteJson = layout as any;
            canvas.backgroundColor = liteJson.settings?.background || '#f8fafc';

            const objectsToAdd: any[] = [];
            const originalRenderOnAddRemove = canvas.renderOnAddRemove;
            canvas.renderOnAddRemove = false;

            (liteJson.rows || []).forEach((row: any) => {
                (row.seats || []).forEach((seat: any) => {
                    const seatObj = createSeat(seat.x, seat.y, row.id, seat.number, canvas, { radius: mergedStyle.seatStyle?.radius, fontSize: mergedStyle.seatNumberStyle?.fontSize });
                    const customSeat = seatObj as any;
                    customSeat.id = seat.id;
                    customSeat.category = seat.categoryId;
                    customSeat.price = seat.price;
                    customSeat.status = seat.status || 'available';
                    objectsToAdd.push(seatObj);
                });

                if (row.labelLeft && row.showLabelLeft) {
                    const labelLeft = createText(row.labelLeft.x, row.labelLeft.y, row.name);
                    const customLeft = labelLeft as any;
                    customLeft.set({
                        fontSize: row.labelLeft.fontSize || 16, fill: row.labelLeft.fill || '#666',
                        selectable: true, evented: true, lockMovementX: false, lockMovementY: false, hasControls: false, hasBorders: true, excludeFromExport: true,
                        originY: 'center', originX: 'right', angle: row.labelLeft.angle || 0
                    });
                    customLeft.id = row.labelLeft.id || `label-left-${row.id}`;
                    customLeft.isRowLabel = true;
                    customLeft.rowId = row.id;
                    objectsToAdd.push(labelLeft);
                }
                if (row.labelRight && row.showLabelRight) {
                    const labelRight = createText(row.labelRight.x, row.labelRight.y, row.name);
                    const customRight = labelRight as any;
                    customRight.set({
                        fontSize: row.labelRight.fontSize || 16, fill: row.labelRight.fill || '#666',
                        selectable: true, evented: true, lockMovementX: false, lockMovementY: false, hasControls: false, hasBorders: true, excludeFromExport: true,
                        originY: 'center', originX: 'left', angle: row.labelRight.angle || 0
                    });
                    customRight.id = row.labelRight.id || `label-right-${row.id}`;
                    customRight.isRowLabel = true;
                    customRight.rowId = row.id;
                    objectsToAdd.push(labelRight);
                }
            });

            (liteJson.shapes || []).forEach((shape: any) => {
                if (shape.type === 'rect') {
                    const rect = createRect(shape.x, shape.y);
                    (rect as any).set({ width: shape.width, height: shape.height, fill: shape.fill, angle: shape.angle });
                    (rect as any).id = shape.id;
                    objectsToAdd.push(rect);
                }
            });

            (liteJson.texts || []).forEach((t: any) => {
                const textObj = createText(t.x, t.y, t.text);
                (textObj as any).set({ fontSize: t.fontSize, fill: t.fill, angle: t.angle });
                (textObj as any).id = t.id;
                objectsToAdd.push(textObj);
            });

            canvas.add(...objectsToAdd);
            canvas.renderOnAddRemove = originalRenderOnAddRemove;
            canvas.requestRenderAll();
            
            onLoadComplete();
        } else {
            console.warn("Unsupported legacy layout format detected. Please use Lite JSON.");
            onLoadComplete(); // Call this to at least set up the empty canvas handlers
        }

        return () => {
            if (readOnlyMouseDownHandler) {
                canvas.off('mouse:down', readOnlyMouseDownHandler);
            }
        };
    }, [canvas, layout, readOnly, onSeatClick]);

    // Handle changes and save logic
    useEffect(() => {
        if (!canvas || readOnly) return;

        const handleCanvasChange = () => {
            if (onChange) {
                const currentRows = useEventGuiStore.getState().rows;
                const json = exportCanvasToLiteJson(
                    canvas, 
                    currentRows, 
                    mergedStyle.width, 
                    mergedStyle.height
                ) as unknown as Layout;
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
