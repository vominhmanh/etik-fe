import { useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import { v4 as uuidv4 } from 'uuid';
import { createSeat } from '../components/createObject';
import { Mode, useEventGuiStore } from '@/zustand/store/eventGuiStore';

const useMultipleSeatCreator = (
  canvas: fabric.Canvas | null,
  toolMode: Mode,
  setToolMode: (mode: Mode) => void
) => {
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const highlightRectRef = useRef<fabric.Rect | null>(null);
  const infoTextRef = useRef<fabric.Text | null>(null);

  const { addRow, rows: existingRows } = useEventGuiStore();

  function getExcelAlpha(n: number) {
    let ordA = 'A'.charCodeAt(0);
    let ordZ = 'Z'.charCodeAt(0);
    let len = ordZ - ordA + 1;
    let s = '';
    while (n >= 0) {
      s = String.fromCharCode((n % len) + ordA) + s;
      n = Math.floor(n / len) - 1;
    }
    return s;
  }

  function getAlphaIndex(s: string) {
    // Basic validation to ensure it's an alpha string
    if (!/^[A-Z]+$/i.test(s)) return -1;
    const upper = s.toUpperCase();
    let n = 0;
    for (let i = 0; i < upper.length; i++) {
      n = n * 26 + (upper.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
    }
    return n - 1;
  }

  useEffect(() => {
    if (!canvas) return;

    const handleMouseDown = (event: fabric.IEvent) => {
      if (toolMode !== 'multiple-seat') return;
      const pointer = canvas.getPointer(event.e);
      startPointRef.current = { x: pointer.x, y: pointer.y };

      // Create highlight rectangle
      const rect = new fabric.Rect({
        left: pointer.x,
        top: pointer.y,
        width: 1,
        height: 1,
        fill: 'rgba(0,0,255,0.1)',
        stroke: 'blue',
        strokeDashArray: [4, 4],
        selectable: false,
        evented: false,
        excludeFromExport: true,
      });
      highlightRectRef.current = rect;
      canvas.add(rect);

      // Create info text
      const text = new fabric.Text('1 X 1', {
        left: pointer.x,
        top: pointer.y,
        fontSize: 14,
        fill: 'blue',
        selectable: false,
        evented: false,
        originX: 'center',
        originY: 'center',
        excludeFromExport: true,
      });
      infoTextRef.current = text;
      canvas.add(text);

      canvas.bringToFront(rect);
      canvas.bringToFront(text);
    };

    const handleMouseMove = (event: fabric.IEvent) => {
      if (
        toolMode !== 'multiple-seat' ||
        !startPointRef.current ||
        !highlightRectRef.current
      )
        return;
      const pointer = canvas.getPointer(event.e);
      const rect = highlightRectRef.current;

      const width = Math.abs(pointer.x - startPointRef.current.x);
      const height = Math.abs(pointer.y - startPointRef.current.y);
      const left = Math.min(pointer.x, startPointRef.current.x);
      const top = Math.min(pointer.y, startPointRef.current.y);

      rect.set({
        width,
        height,
        left,
        top,
      });

      // Update info text
      if (infoTextRef.current) {
        const rows = Math.max(1, Math.floor(height / 25));
        const cols = Math.max(1, Math.floor(width / 25));
        infoTextRef.current.set({
          text: `${rows} X ${cols}`,
          left: left + width / 2,
          top: top + height / 2,
        });
        canvas.bringToFront(infoTextRef.current);
      }

      canvas.requestRenderAll();
      canvas.bringToFront(rect);
    };

    const handleMouseUp = (event: fabric.IEvent) => {
      if (toolMode !== 'multiple-seat' || !startPointRef.current) return;
      const endPoint = canvas.getPointer(event.e);
      const startPoint = startPointRef.current;
      const width = Math.abs(endPoint.x - startPoint.x);
      const height = Math.abs(endPoint.y - startPoint.y);

      const rowsCount = Math.max(1, Math.floor(height / 25));
      const colsCount = Math.max(1, Math.floor(width / 25));

      // Normalize start coordinates
      const startX = Math.min(startPoint.x, endPoint.x);
      const startY = Math.min(startPoint.y, endPoint.y);

      // Generate Rows and Seats
      // Determine start index based on existing rows logic (Max Char + 1)
      // Scan valid row names from CANVAS objects (Labels) instead of Store
      // This ensures we only count rows that actually exist visually.
      const canvasObjects = canvas.getObjects() as any[];
      const usedRowNames = new Set<string>();

      canvasObjects.forEach(obj => {
        if (obj.isRowLabel && obj.text) {
          usedRowNames.add(obj.text);
        }
      });

      const existingIndices = Array.from(usedRowNames)
        .map((name) => getAlphaIndex(name))
        .filter((n) => n >= 0);

      const maxIndex =
        existingIndices.length > 0 ? Math.max(...existingIndices) : -1;
      const startIndex = maxIndex + 1;
      const newSeats: fabric.Object[] = []; // Restored

      for (let i = 0; i < rowsCount; i++) {
        const rowId = uuidv4();
        const rowName = getExcelAlpha(startIndex + i);

        addRow({
          id: rowId,
          name: rowName,
          showLabelLeft: true,
          showLabelRight: true,
        });

        for (let j = 0; j < colsCount; j++) {
          const left = startX + j * 25;
          const top = startY + i * 25;
          const seatNumber = String(j + 1);

          // Updated createSeat call with correct signature: left, top, rowId, seatNumber, canvas
          const seat = createSeat(left, top, rowId, seatNumber, canvas);
          newSeats.push(seat);
        }
      }

      canvas.renderOnAddRemove = false;
      canvas.add(...newSeats);
      canvas.renderOnAddRemove = true;
      canvas.renderAll();

      // Cleanup
      if (highlightRectRef.current) {
        canvas.remove(highlightRectRef.current);
        highlightRectRef.current = null;
      }
      if (infoTextRef.current) {
        canvas.remove(infoTextRef.current);
        infoTextRef.current = null;
      }

      startPointRef.current = null;
      setToolMode('select');

      // Auto-select the newly created seats AND their labels
      // We use a small timeout to allow useRowLabelRenderer to react to the store update and create the labels
      setTimeout(() => {
        if (!canvas) return;

        // Collect all row IDs we just created
        const createdRowIds = new Set(newSeats.map((s: any) => s.rowId));

        // Find all objects that belong to these rows (seats + labels)
        const objectsToSelect = canvas.getObjects().filter((obj: any) => {
          return obj.rowId && createdRowIds.has(obj.rowId);
        });

        if (objectsToSelect.length > 0) {
          const selection = new fabric.ActiveSelection(objectsToSelect, {
            canvas: canvas,
          });
          canvas.setActiveObject(selection);
          canvas.requestRenderAll();
        }
      }, 100);
    };

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
    };
  }, [canvas, toolMode, setToolMode, existingRows, addRow]);
};

export default useMultipleSeatCreator;
