import { useEffect, useCallback } from 'react';
import { fabric } from 'fabric';
import { useEventGuiStore } from '@/zustand/store/eventGuiStore';
import { CustomFabricObject } from '@/types/fabric-types';

const useRowLabelRenderer = (canvas: fabric.Canvas | null) => {
    const { rows, updateRow } = useEventGuiStore();

    const syncLabels = useCallback(() => {
        if (!canvas) return;
        const allObjects = canvas.getObjects() as CustomFabricObject[];

        // Map of existing labels for quick lookup
        const labelMap = new Map<string, fabric.IText>();
        allObjects.forEach((obj) => {
            if (obj.isRowLabel && obj.id) {
                labelMap.set(obj.id, obj as fabric.IText);
            }
        });

        const activeRowIds = new Set<string>();

        rows.forEach((row) => {
            activeRowIds.add(row.id);
            const rowSeats = allObjects.filter((obj) => obj.rowId === row.id && !(obj as any).isRowLabel);

            // If no seats, hide labels if they exist
            if (rowSeats.length === 0) {
                ['left', 'right'].forEach(side => {
                    const label = labelMap.get(`label-${side}-${row.id}`);
                    if (label) label.set('visible', false);
                });
                return;
            }

            // Find Edge Seats (First and Last in terms of X position)
            let minLeftSeat = rowSeats[0];
            let maxLeftSeat = rowSeats[0];

            rowSeats.forEach((seat) => {
                const sLeft = seat.left || 0;
                if (sLeft < (minLeftSeat.left || 0)) minLeftSeat = seat;
                if (sLeft > (maxLeftSeat.left || 0)) maxLeftSeat = seat;
            });

            const createLabel = (id: string, originX: string) => new fabric.IText(row.name, {
                id,
                fontSize: 16,
                fill: '#666',
                selectable: true,
                evented: true,
                lockMovementX: true,
                lockMovementY: true,
                hasControls: false,
                excludeFromExport: true,
                originY: 'center',
                originX: originX,
                isRowLabel: true,
                rowId: row.id
            } as any);

            // --- Sync Left Label ---
            const leftId = `label-left-${row.id}`;
            let leftLabel = labelMap.get(leftId);

            if (!leftLabel) {
                leftLabel = createLabel(leftId, 'right');
                canvas.add(leftLabel);
            }

            // Align Left Label to the left of the leftmost seat
            // Center Y aligned with that specific seat
            const leftSeatCenterY = (minLeftSeat.top || 0) + ((minLeftSeat.height || 0) * (minLeftSeat.scaleY || 1)) / 2;

            leftLabel.set({
                text: row.name,
                left: (minLeftSeat.left || 0) - 10, // 10px padding
                top: leftSeatCenterY,
                originX: 'right',
                visible: !!row.showLabelLeft
            });

            // --- Sync Right Label ---
            const rightId = `label-right-${row.id}`;
            let rightLabel = labelMap.get(rightId);

            if (!rightLabel) {
                rightLabel = createLabel(rightId, 'left');
                canvas.add(rightLabel);
            }

            // Align Right Label to the right of the rightmost seat
            const rightSeatWidth = (maxLeftSeat.width || 0) * (maxLeftSeat.scaleX || 1);
            const rightSeatCenterY = (maxLeftSeat.top || 0) + ((maxLeftSeat.height || 0) * (maxLeftSeat.scaleY || 1)) / 2;

            rightLabel.set({
                text: row.name,
                left: (maxLeftSeat.left || 0) + rightSeatWidth + 10, // 10px padding
                top: rightSeatCenterY,
                originX: 'left',
                visible: !!row.showLabelRight
            });
        });

        // Cleanup orphaned labels (rows that were deleted)
        labelMap.forEach((label) => {
            const rId = (label as any).rowId;
            if (rId && !activeRowIds.has(rId)) canvas.remove(label);
        });

        canvas.requestRenderAll();

    }, [canvas, rows]);

    // Listeners
    useEffect(() => {
        if (!canvas) return;

        const handleSync = (e: fabric.IEvent) => {
            const t = e.target as any;
            if (t?.isRowLabel) return;
            syncLabels();
        };

        const handleTextChange = (e: fabric.IEvent) => {
            const t = e.target as CustomFabricObject;
            if (t?.isRowLabel && t.rowId) {
                // Update store
                updateRow(t.rowId, { name: t.text });
            }
        };

        canvas.on('object:modified', handleSync);
        canvas.on('object:added', handleSync);
        canvas.on('object:removed', handleSync);
        canvas.on('text:changed', handleTextChange); // For IText editing

        syncLabels();

        return () => {
            canvas.off('object:modified', handleSync);
            canvas.off('object:added', handleSync);
            canvas.off('object:removed', handleSync);
            canvas.off('text:changed', handleTextChange);
        };
    }, [canvas, syncLabels, updateRow]);
};

export default useRowLabelRenderer;

