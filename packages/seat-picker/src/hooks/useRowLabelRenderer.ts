import { useEffect, useCallback, useRef } from 'react';
import { fabric } from 'fabric';
import { useEventGuiStore } from '@/zustand/store/eventGuiStore';
import { CustomFabricObject } from '@/types/fabric-types';

const useRowLabelRenderer = (canvas: fabric.Canvas | null) => {
    const { rows, updateRow } = useEventGuiStore();
    const dirtyRowIdsRef = useRef(new Set<string>());

    const syncLabels = useCallback((snapToDefault = false, dirtyRowIds = new Set<string>()) => {
        if (!canvas) return;
        const allObjects = canvas.getObjects() as CustomFabricObject[];

        let activeObjects: fabric.Object[] = [];
        let wasActiveSelection = false;

        if (snapToDefault) {
            const activeObj = canvas.getActiveObject();
            if (activeObj?.type === 'activeSelection') {
                wasActiveSelection = true;
                activeObjects = canvas.getActiveObjects();
                canvas.discardActiveObject();
                // Ensure matrix is cleared
                activeObjects.forEach(obj => obj.setCoords());
            }
        }

        // Group Seats and Labels by RowId for O(1) lookup
        const seatsByRow: Record<string, CustomFabricObject[]> = {};
        const labelsByRow: Record<string, CustomFabricObject[]> = {};

        allObjects.forEach(obj => {
            if (obj.rowId) {
                if (obj.isRowLabel) {
                    if (!labelsByRow[obj.rowId]) labelsByRow[obj.rowId] = [];
                    labelsByRow[obj.rowId].push(obj);
                } else {
                    if (!seatsByRow[obj.rowId]) seatsByRow[obj.rowId] = [];
                    seatsByRow[obj.rowId].push(obj);
                }
            }
        });

        const activeRowIds = new Set<string>();

        rows.forEach((row) => {
            activeRowIds.add(row.id);
            const rowSeats = seatsByRow[row.id] || [];

            // If no seats, hide labels if they exist
            if (rowSeats.length === 0) {
                const rowLabels = labelsByRow[row.id] || [];
                rowLabels.forEach(l => l.set('visible', false));
                return;
            }

            // Find Edge Seats using Absolute Coordinates
            let minLeftSeat = rowSeats[0];
            let maxLeftSeat = rowSeats[0];
            let minLeftRect = minLeftSeat.getBoundingRect();
            let maxLeftRect = maxLeftSeat.getBoundingRect();

            rowSeats.forEach((seat) => {
                const rect = seat.getBoundingRect();
                if (rect.left < minLeftRect.left) {
                    minLeftSeat = seat;
                    minLeftRect = rect;
                }
                if (rect.left > maxLeftRect.left) {
                    maxLeftSeat = seat;
                    maxLeftRect = rect;
                }
            });

            const createLabel = (id: string, originX: string) => new fabric.IText(row.name, {
                id,
                fontSize: row.fontSize || 16,
                fill: '#666',
                selectable: true,
                evented: true,
                lockMovementX: false,
                lockMovementY: false,
                hasControls: false,
                hasBorders: true,
                excludeFromExport: true,
                originY: 'center',
                originX: originX,
                isRowLabel: true,
                rowId: row.id
            } as any) as unknown as CustomFabricObject;

            const shouldSnap = snapToDefault && (dirtyRowIds.has(row.id) || dirtyRowIds.has('*'));

            // Find ALL labels for this row
            const rowLabels = labelsByRow[row.id] || [];

            // --- Sync Left Label ---
            const leftCandidates = rowLabels.filter(l => l.originX === 'right');
            let leftLabel = leftCandidates[0];

            // Deduplicate
            if (leftCandidates.length > 1) {
                for (let i = 1; i < leftCandidates.length; i++) canvas.remove(leftCandidates[i] as any);
            }

            const leftId = `label-left-${row.id}`;
            if (leftLabel && leftLabel.id !== leftId) {
                (leftLabel as any).id = leftId;
            }

            if (!leftLabel || shouldSnap) {
                const leftSeatCenterY = minLeftRect.top + minLeftRect.height / 2;
                const defaultLeftX = minLeftRect.left - 10;

                if (!leftLabel) {
                    leftLabel = createLabel(leftId, 'right');
                    canvas.add(leftLabel as any);
                    if (wasActiveSelection && activeObjects.some((o: any) => o.rowId === row.id)) {
                        activeObjects.push(leftLabel as any);
                    }
                }

                leftLabel.set({
                    text: row.name,
                    left: defaultLeftX,
                    top: leftSeatCenterY,
                    originX: 'right',
                    visible: !!row.showLabelLeft,
                    fontSize: row.fontSize || 16,
                    lockMovementX: false,
                    lockMovementY: false,
                });
                leftLabel.setCoords();
            } else {
                leftLabel.set({
                    text: row.name,
                    visible: !!row.showLabelLeft,
                    fontSize: row.fontSize || 16,
                });
            }

            // --- Sync Right Label ---
            const rightCandidates = rowLabels.filter(l => l.originX === 'left');
            let rightLabel = rightCandidates[0];

            // Deduplicate
            if (rightCandidates.length > 1) {
                for (let i = 1; i < rightCandidates.length; i++) canvas.remove(rightCandidates[i] as any);
            }

            const rightId = `label-right-${row.id}`;
            if (rightLabel && rightLabel.id !== rightId) {
                (rightLabel as any).id = rightId;
            }

            if (!rightLabel || shouldSnap) {
                const rightSeatCenterY = maxLeftRect.top + maxLeftRect.height / 2;
                const defaultRightX = maxLeftRect.left + maxLeftRect.width + 10;

                if (!rightLabel) {
                    rightLabel = createLabel(rightId, 'left');
                    canvas.add(rightLabel as any);
                    if (wasActiveSelection && activeObjects.some((o: any) => o.rowId === row.id)) {
                        activeObjects.push(rightLabel as any);
                    }
                }

                rightLabel.set({
                    text: row.name,
                    left: defaultRightX,
                    top: rightSeatCenterY,
                    originX: 'left',
                    visible: !!row.showLabelRight,
                    fontSize: row.fontSize || 16,
                    lockMovementX: false,
                    lockMovementY: false,
                });
                rightLabel.setCoords();
            } else {
                rightLabel.set({
                    text: row.name,
                    visible: !!row.showLabelRight,
                    fontSize: row.fontSize || 16,
                });
            }
        });

        // Cleanup orphaned labels (rows that were deleted)
        Object.keys(labelsByRow).forEach(rId => {
            if (!activeRowIds.has(rId)) {
                labelsByRow[rId].forEach(l => canvas.remove(l as any));
            }
        });

        if (wasActiveSelection && activeObjects.length > 0) {
            canvas.setActiveObject(new fabric.ActiveSelection(activeObjects, { canvas }));
        }

        canvas.requestRenderAll();

    }, [canvas, rows]);

    // Listeners
    useEffect(() => {
        if (!canvas) return;

        const handleModified = (e: fabric.IEvent) => {
            const t = e.target as any;
            if (t?.isRowLabel) return;
            // Existing seat moved -> KEEP independent positions
            syncLabels(false);
        };

        let debounceTimer: NodeJS.Timeout;

        const handleTopologyChange = (e: fabric.IEvent) => {
            const target = e.target as CustomFabricObject;
            if (target && target.rowId) {
                dirtyRowIdsRef.current.add(target.rowId);
            }

            // Debounce the heavy label sync
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const dirtyIds = new Set(dirtyRowIdsRef.current);
                dirtyRowIdsRef.current.clear();
                syncLabels(true, dirtyIds);
            }, 10);
        };

        const handleTextChange = (e: fabric.IEvent) => {
            const t = e.target as CustomFabricObject;
            if (t?.isRowLabel && t.rowId) {
                // Update store
                updateRow(t.rowId, { name: t.text });
            }
        };

        canvas.on('object:modified', handleModified);
        canvas.on('object:added', handleTopologyChange);
        canvas.on('object:removed', handleTopologyChange);
        canvas.on('text:changed', handleTextChange);

        syncLabels(false); // Initial render

        return () => {
            clearTimeout(debounceTimer);
            canvas.off('object:modified', handleModified);
            canvas.off('object:added', handleTopologyChange);
            canvas.off('object:removed', handleTopologyChange);
            canvas.off('text:changed', handleTextChange);
        };
    }, [canvas, syncLabels, updateRow]);
};

export default useRowLabelRenderer;

