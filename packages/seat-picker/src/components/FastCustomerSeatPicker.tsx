import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { LuList, LuX, LuPlus, LuMinus } from 'react-icons/lu';
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";
import { SeatCanvasProps, SeatData, CategoryStats, CategoryInfo, ShowSeat } from '@/types/data.types';
import { EMPTY_OBJECT } from '@/utils/constants';
import { SEAT_STYLE_CONFIG } from './createObject/applyCustomStyles';

const defaultStyle = {
    width: 800,
    height: 600,
    backgroundColor: '#f8fafc',
    showSeatNumbers: true,
    seatNumberStyle: {
        fontSize: 10,
        fill: '#222',
        fontWeight: 'bold',
        fontFamily: 'Arial',
    },
    seatStyle: {
        fill: 'rgba(209, 193, 193, 0.7)',
        stroke: '#000000',
        strokeWidth: 0,
        radius: 10,
    },
};

// Helper to darken hex color
function darkenHexColor(hex: string, percent: number): string {
    if (!hex || !hex.startsWith('#')) return hex;
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    r = Math.floor(r * (100 - percent) / 100);
    g = Math.floor(g * (100 - percent) / 100);
    b = Math.floor(b * (100 - percent) / 100);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

const FastCustomerSeatPicker: React.FC<SeatCanvasProps> = ({
    layout,
    readOnly = false,
    style = EMPTY_OBJECT,
    categories = [],
    existingSeats = [],
    selectedSeatIds = [],
    onSelectionChange,
    onSeatClick,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);

    // Viewport State
    const [hoveredSeatId, setHoveredSeatId] = useState<string | null>(null);

    const mergedStyle = useMemo(() => ({
        ...defaultStyle,
        ...style,
        width: (layout as any)?.settings?.width || (style as any).width || defaultStyle.width,
        height: (layout as any)?.settings?.height || (style as any).height || defaultStyle.height,
    }), [style, layout]);

    const mergedStyleRef = useRef(mergedStyle);
    useEffect(() => {
        mergedStyleRef.current = mergedStyle;
    }, [mergedStyle]);

    // Pre-process Data into Fast Arrays
    const parsedData = useMemo(() => {
        if (!layout || !(layout as any).isLite) return null;
        const liteJson = layout as any;

        const seatsMap = new Map<string, any>();
        const renderSeats: any[] = [];
        const renderTexts: any[] = [];
        const renderRects: any[] = [];

        // Parse Texts
        (liteJson.texts || []).forEach((t: any) => renderTexts.push(t));

        // Parse Rects
        (liteJson.shapes || []).forEach((s: any) => {
            if (s.type === 'rect') renderRects.push(s);
        });

        // Parse Rows & Seats
        (liteJson.rows || []).forEach((row: any) => {
            if (row.showLabelLeft && row.labelLeft) {
                renderTexts.push({ ...row.labelLeft, text: row.name, originX: 'right' });
            }
            if (row.showLabelRight && row.labelRight) {
                renderTexts.push({ ...row.labelRight, text: row.name, originX: 'left' });
            }

            (row.seats || []).forEach((seatData: any) => {
                const s = {
                    id: String(seatData.id),
                    x: seatData.x + 10,
                    y: seatData.y + 10,
                    number: seatData.number,
                    categoryId: seatData.categoryId,
                    status: seatData.status || 'available',
                    rowId: String(row.id),
                    rowLabel: row.name,
                };
                renderSeats.push(s);
                seatsMap.set(s.id, s);
            });
        });

        return { renderSeats, renderTexts, renderRects, seatsMap, settings: liteJson.settings };
    }, [layout]);

    // Merge layout categories (which have colors from designer) with props categories
    const catMap = useMemo(() => {
        const layoutCategories = (layout as any)?.categories || [];
        const mergedCatMap = new Map();
        layoutCategories.forEach((c: any) => mergedCatMap.set(String(c.id), { ...c }));
        categories.forEach((c: any) => {
            const existing = mergedCatMap.get(String(c.id)) || {};
            mergedCatMap.set(String(c.id), { ...existing, ...c, color: c.color || existing.color });
        });
        return mergedCatMap;
    }, [categories, layout]);

    // Synchronize dynamic status
    const finalSeats = useMemo(() => {
        if (!parsedData) return [];

        const existingMap = new Map(existingSeats.map((s) => [s.canvasSeatId, s]));

        return parsedData.renderSeats.map(seat => {
            let catId = seat.categoryId ? String(seat.categoryId) : null;
            let status = seat.status;

            const dbSeat = existingMap.get(seat.id);
            if (dbSeat && dbSeat.ticketCategoryId) {
                catId = String(dbSeat.ticketCategoryId);
                const dbStatus = dbSeat.status as string;

                // User requirement: existingSeat is only responsible for held and sold. 
                // Blocked is already handled by JSON.
                if (dbStatus === 'sold' || dbStatus === 'held') {
                    status = dbStatus as any;
                }
            }

            const catInfo = catId ? catMap.get(catId) : null;
            const isAvailable = status === 'available';
            const evented = !!catId && (readOnly || isAvailable);

            let fill = (catInfo as any)?.color || SEAT_STYLE_CONFIG.empty.fill;
            let stroke = '#000000';
            const isSelected = selectedSeatIds.includes(seat.id);

            let iconKey = '';
            if (!isAvailable) {
                if (status === 'blocked') {
                    fill = '#999999';
                    stroke = '#666666';
                    iconKey = 'blocked';
                } else if (status === 'sold') {
                    fill = darkenHexColor(fill, 40);
                    stroke = '#999999';
                    iconKey = 'sold';
                } else if (status === 'held') {
                    fill = darkenHexColor(fill, 20);
                    stroke = '#000000';
                    iconKey = 'held';
                } else {
                    fill = '#999999';
                    stroke = '#666666';
                    iconKey = 'blocked';
                }
            } else if (!catId) {
                fill = SEAT_STYLE_CONFIG.empty.fill;
                stroke = 'transparent';
                iconKey = '';
            }

            return {
                ...seat,
                catId,
                status,
                catInfo,
                isAvailable,
                evented,
                fill,
                stroke,
                isSelected,
                iconKey,
                price: (catInfo as any)?.price || 0,
            };
        });
    }, [parsedData, existingSeats, categories, selectedSeatIds, readOnly, catMap]);

    // Calculate minimum scale to fit 95% of container
    const getMinScale = useCallback(() => {
        const parent = containerRef.current;
        if (!parent) return 0.1;
        const rect = parent.getBoundingClientRect();
        const style = mergedStyleRef.current;
        const scaleX = rect.width / style.width;
        const scaleY = rect.height / style.height;
        return Math.min(scaleX, scaleY) * 0.95; // Occupies 95% of container, minimal padding
    }, []);

    // Render Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !parsedData) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;

        const render = () => {
            const dpr = window.devicePixelRatio || 1;

            // Mobile browsers (especially iOS) have a strict limit on maximum canvas pixels (usually ~16 million).
            // E.g., iOS max is 16.7 megapixels. We cap it slightly below to be safe.
            const MAX_CANVAS_PIXELS = 16000000; 
            const totalCssPixels = mergedStyle.width * mergedStyle.height;
            let safeDpr = dpr;
            if (totalCssPixels * safeDpr * safeDpr > MAX_CANVAS_PIXELS) {
                safeDpr = Math.sqrt(MAX_CANVAS_PIXELS / totalCssPixels);
            }
            safeDpr = Math.max(0.1, safeDpr);

            canvas.width = mergedStyle.width * safeDpr;
            canvas.height = mergedStyle.height * safeDpr;

            ctx.save();
            ctx.scale(safeDpr, safeDpr); // Map logical pixels to physical pixels

            // Clear
            ctx.fillStyle = mergedStyle.backgroundColor;
            ctx.fillRect(0, 0, mergedStyle.width, mergedStyle.height);

            // Draw Rects
            parsedData.renderRects.forEach(rect => {
                ctx.fillStyle = rect.fill || '#ccc';
                ctx.save();
                ctx.translate(rect.x, rect.y);
                if (rect.angle) ctx.rotate((rect.angle * Math.PI) / 180);
                ctx.fillRect(0, 0, rect.width, rect.height);
                ctx.restore();
            });

            // Draw Texts
            ctx.textBaseline = 'middle';
            parsedData.renderTexts.forEach(t => {
                ctx.font = `${t.fontSize}px Arial`;
                ctx.fillStyle = t.fill || '#000';

                let x = t.x;
                if (t.originX === 'right') {
                    ctx.textAlign = 'right';
                } else if (t.originX === 'center') {
                    ctx.textAlign = 'center';
                } else {
                    ctx.textAlign = 'center';
                }
                ctx.textBaseline = 'middle';
                ctx.save();
                ctx.translate(t.x, t.y);
                if (t.angle) ctx.rotate((t.angle * Math.PI) / 180);
                ctx.fillText(t.text, 0, 0);
                ctx.restore();
            });

            // Draw Seats
            const radius = mergedStyle.seatStyle.radius || 10;

            // Create path for checkmark (Selected state)
            const checkPath = new Path2D('M -3 -1 L -1 2 L 4 -4');

            finalSeats.forEach(seat => {
                ctx.beginPath();
                ctx.arc(seat.x, seat.y, radius, 0, 2 * Math.PI);
                ctx.fillStyle = seat.fill;
                ctx.fill();

                let currentStrokeWidth = mergedStyle.seatStyle.strokeWidth ?? 0;
                ctx.strokeStyle = seat.stroke;

                // Hover logic
                if (hoveredSeatId === seat.id && seat.evented) {
                    currentStrokeWidth = (currentStrokeWidth || 1) + 2;
                }

                // Selection logic
                if (seat.isSelected) {
                    ctx.strokeStyle = '#2196F3';
                    currentStrokeWidth = 3;
                }

                if (currentStrokeWidth > 0) {
                    ctx.lineWidth = currentStrokeWidth;
                    ctx.stroke();
                }

                // Selection Icon Overlay
                if (seat.isSelected) {
                    ctx.save();
                    ctx.globalAlpha = 0.6;
                    ctx.beginPath();
                    ctx.arc(seat.x, seat.y, 8, 0, 2 * Math.PI);
                    ctx.fillStyle = '#4CAF50';
                    ctx.fill();

                    // Draw Checkmark
                    ctx.beginPath();
                    ctx.strokeStyle = '#FFFFFF';
                    ctx.lineWidth = 2;
                    ctx.moveTo(seat.x - 3, seat.y);
                    ctx.lineTo(seat.x - 1, seat.y + 3);
                    ctx.lineTo(seat.x + 4, seat.y - 3);
                    ctx.stroke();
                    ctx.restore();
                } else if (mergedStyle.showSeatNumbers) {
                    // Draw Number
                    ctx.font = `${mergedStyle.seatNumberStyle.fontSize}px ${mergedStyle.seatNumberStyle.fontFamily || 'Arial'}`;
                    ctx.fillStyle = mergedStyle.seatNumberStyle.fill || '#000';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    // slightly down for visual center
                    ctx.fillText(seat.number, seat.x, seat.y + 1);
                }

                // Draw Status Icons (sold/held)
                if (!seat.isAvailable && seat.iconKey) {
                    const svgPath = SEAT_STYLE_CONFIG.icons[seat.iconKey as keyof typeof SEAT_STYLE_CONFIG.icons];
                    if (svgPath) {
                        ctx.save();
                        ctx.translate(seat.x, seat.y);
                        const s = (radius * 1.2) / 24;
                        ctx.scale(s, s);
                        ctx.translate(-12, -12);
                        const p2d = new Path2D(svgPath);
                        ctx.fillStyle = 'rgba(255,255,255,0.9)';
                        ctx.shadowColor = 'rgba(0,0,0,0.5)';
                        ctx.shadowBlur = 2;
                        ctx.fill(p2d);
                        ctx.restore();
                    }
                }
            });

            ctx.restore();
        };

        animationFrameId = requestAnimationFrame(render);

        return () => cancelAnimationFrame(animationFrameId);
    }, [parsedData, finalSeats, mergedStyle, hoveredSeatId]);

    // Event Handlers
    const handlePointerMove = (e: React.PointerEvent) => {
        // Hit Detection for Hover
        if (!canvasRef.current) return;

        // CSS transforms applied by react-zoom-pan-pinch mean offsetX/offsetY are naturally scaled correctly
        const mouseX = e.nativeEvent.offsetX;
        const mouseY = e.nativeEvent.offsetY;

        const radius = mergedStyle.seatStyle.radius || 10;
        const hitRadius = radius * 1.5; // Slightly larger hit area

        let found: string | null = null;
        for (let i = finalSeats.length - 1; i >= 0; i--) {
            const seat = finalSeats[i];
            if (!seat.evented) continue;
            const dx = seat.x - mouseX;
            const dy = seat.y - mouseY;
            if (dx * dx + dy * dy <= hitRadius * hitRadius) {
                found = seat.id;
                break;
            }
        }

        if (found !== hoveredSeatId) {
            setHoveredSeatId(found);
        }
    };

    const handleClick = (e: React.MouseEvent) => {
        // Handle Click - react-zoom-pan-pinch prevents this from firing if dragging!
        const mouseX = e.nativeEvent.offsetX;
        const mouseY = e.nativeEvent.offsetY;

        const radius = mergedStyle.seatStyle.radius || 10;
        const hitRadius = radius * 1.5;

        let foundSeat: typeof finalSeats[0] | null = null;
        for (let i = finalSeats.length - 1; i >= 0; i--) {
            const seat = finalSeats[i];
            if (!seat.evented) continue;
            const dx = seat.x - mouseX;
            const dy = seat.y - mouseY;
            if (dx * dx + dy * dy <= hitRadius * hitRadius) {
                foundSeat = seat;
                break;
            }
        }

        if (foundSeat) {
            let newIds = [...selectedSeatIds];
            if (newIds.includes(foundSeat.id)) {
                newIds = newIds.filter(id => id !== foundSeat.id);
            } else {
                newIds.push(foundSeat.id);
            }

            if (onSelectionChange) {
                const selectedData = finalSeats.filter(s => newIds.includes(s.id)).map(s => ({
                    id: s.id,
                    number: s.number,
                    price: s.price,
                    rowLabel: s.rowLabel,
                    category: s.catId,
                    status: s.status,
                    categoryInfo: s.catInfo || { id: s.catId, name: 'Unknown', price: 0, color: '#999' }
                }));
                onSelectionChange(newIds, selectedData as any);
            }

            if (onSeatClick) {
                onSeatClick({
                    id: foundSeat.id,
                    number: foundSeat.number,
                    price: foundSeat.price,
                    rowLabel: foundSeat.rowLabel,
                    category: foundSeat.catId,
                    status: foundSeat.status,
                    categoryInfo: foundSeat.catInfo || { id: foundSeat.catId, name: 'Unknown', price: 0, color: '#999' }
                } as any);
            }
        }
    };

    const selectedSeatsData = useMemo(() => {
        return finalSeats.filter(s => s.isSelected);
    }, [finalSeats]);

    const handleRemoveSeat = (seatIdToRemove: string) => {
        if (!onSelectionChange) return;
        const newSelectedSeats = selectedSeatsData.filter(seat => seat.id !== seatIdToRemove);
        const newIds = newSelectedSeats.map(seat => seat.id);
        onSelectionChange(newIds, newSelectedSeats as any);
    };

    return (
        <div className={`relative flex h-[600px] w-full flex-row bg-gray-200`}>
            {/* Main Content Area (Canvas) */}
            <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden">
                <div className="flex h-0 min-h-0 w-full flex-1 overflow-hidden relative" ref={containerRef}>

                    {/* Canvas Wrapper */}
                    <TransformWrapper
                        initialScale={getMinScale()}
                        minScale={getMinScale()}
                        maxScale={4}
                        centerOnInit={true}
                        limitToBounds={false}
                        wheel={{ step: 0.002 }}
                        zoomAnimation={{ animationTime: 400, animationType: "easeOutCubic" }}

                        doubleClick={{ disabled: true }}
                    >
                        {({ zoomIn, zoomOut, resetTransform }) => (
                            <>
                                <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
                                    <div style={{
                                        width: mergedStyle.width,
                                        height: mergedStyle.height,
                                        border: '2px dashed #94a3b8',
                                        backgroundColor: mergedStyle.backgroundColor,
                                        boxSizing: 'border-box'
                                    }}>
                                        <canvas
                                            ref={canvasRef}
                                            onClick={handleClick}
                                            onPointerMove={handlePointerMove}
                                            onPointerLeave={() => setHoveredSeatId(null)}
                                            style={{
                                                display: 'block',
                                                width: '100%',
                                                height: '100%',
                                                cursor: hoveredSeatId ? 'pointer' : 'grab'
                                            }}
                                        />
                                    </div>
                                </TransformComponent>

                                {/* Zoom Controls */}
                                <div className="absolute bottom-6 left-6 z-20 flex flex-col bg-white/90 backdrop-blur-md rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-gray-200/50 overflow-hidden">
                                    <button onClick={() => zoomIn(0.3, 400)} className="p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 active:bg-blue-100 transition-all focus:outline-none flex items-center justify-center border-b border-gray-100" aria-label="Zoom In" title="Phóng to">
                                        <LuPlus size={18} strokeWidth={2.5} />
                                    </button>
                                    <button onClick={() => zoomOut(0.3, 400)} className="p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 active:bg-blue-100 transition-all focus:outline-none flex items-center justify-center border-b border-gray-100" aria-label="Zoom Out" title="Thu nhỏ">
                                        <LuMinus size={18} strokeWidth={2.5} />
                                    </button>
                                    <button onClick={() => resetTransform(400)} className="px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 active:bg-blue-100 transition-all focus:outline-none flex items-center justify-center font-bold text-[11px] uppercase tracking-wider" title="Khôi phục">
                                        Reset
                                    </button>
                                </div>
                            </>
                        )}
                    </TransformWrapper>

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
                                {(() => {
                                    const displayCategories = Array.from(catMap.values());
                                    return displayCategories.length > 0 ? (
                                        displayCategories.map((cat: any) => (
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
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Selected Seats Section */}
                        <div className="flex-1 overflow-y-auto p-3">
                            <h3 className="text-xs font-bold text-gray-500 mb-2 flex items-center justify-between uppercase tracking-wider">
                                Ordered Tickets
                                <span className="bg-blue-100 text-blue-700 py-0.5 px-1.5 rounded-full text-[10px]">{selectedSeatsData.length}</span>
                            </h3>

                            <div className="space-y-1.5">
                                {selectedSeatsData.map((seat: any) => {
                                    return (
                                        <div key={seat.id} className="flex items-center p-2 bg-gray-50 rounded border border-gray-100 items-stretch group relative">
                                            <div className="flex items-center justify-center mr-2">
                                                <span
                                                    className="w-3 h-3 rounded-full shadow-sm border border-black/10"
                                                    style={{ backgroundColor: seat.catInfo?.color || '#ccc' }}
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                <div className="text-xs font-medium text-gray-800">
                                                    <span className="font-bold text-gray-900">{seat.rowLabel}</span>-{seat.number}
                                                </div>
                                                <div className="text-[10px] text-gray-500 truncate">
                                                    {seat.catInfo?.name || 'Unknown Category'}
                                                </div>
                                            </div>

                                            {/* Delete Button */}
                                            <button
                                                onClick={() => handleRemoveSeat(seat.id)}
                                                className="ml-1 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                                title="Remove ticket"
                                            >
                                                <LuX size={14} />
                                            </button>
                                        </div>
                                    );
                                })}
                                {selectedSeatsData.length === 0 && (
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

export default FastCustomerSeatPicker;
