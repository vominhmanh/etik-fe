import { useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import { v4 as uuidv4 } from 'uuid';
import { createSeat, createRect, createText } from '../components/createObject';
import { Mode } from '@/zustand/store/eventGuiStore';

const useObjectCreator = (
  canvas: fabric.Canvas | null,
  toolMode: Mode,
  setToolMode: (mode: Mode) => void
) => {
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const rectRef = useRef<fabric.Rect | null>(null);
  const isDraggingRef = useRef(false);

  // Polygon refs
  const polygonPointsRef = useRef<{ x: number; y: number }[]>([]);
  const activeLineRef = useRef<fabric.Line | null>(null);
  const linesRef = useRef<fabric.Line[]>([]);

  useEffect(() => {
    if (!canvas) return;

    const handleMouseDown = (event: fabric.IEvent) => {
      const pointer = canvas.getPointer(event.e);

      if (toolMode === 'one-seat') {
        const seat = createSeat(pointer.x, pointer.y, uuidv4(), '1', canvas);
        canvas.add(seat);
        canvas.renderAll();
      } else if (toolMode === 'shape-square') {
        const rect = createRect(pointer.x, pointer.y);
        rectRef.current = rect;
        isDraggingRef.current = false;
        canvas.add(rect);
        canvas.setActiveObject(rect);
        startPointRef.current = { x: pointer.x, y: pointer.y };
      } else if (toolMode === 'text') {
        const text = createText(pointer.x, pointer.y);
        canvas.add(text);
        canvas.setActiveObject(text);
        text.enterEditing();
        text.selectAll();
      } else if (toolMode === 'shape-polygon') {
        // Polygon drawing logic
        const points = polygonPointsRef.current;
        points.push({ x: pointer.x, y: pointer.y });

        // If we have more than 1 point, finalize the previous active line
        if (points.length > 1) {
          // The visual line already exists (it was the active line), we just keep it
          // and push it to linesRef
          if (activeLineRef.current) {
            linesRef.current.push(activeLineRef.current);
            // No need to remove/add, just update ref
          }
        }

        // Create a new active line for the next segment
        const pointsCoords = [pointer.x, pointer.y, pointer.x, pointer.y];
        const line = new fabric.Line(pointsCoords, {
          strokeWidth: 2,
          fill: '#999',
          stroke: '#999',
          originX: 'center',
          originY: 'center',
          selectable: false,
          evented: false,
        });

        activeLineRef.current = line;
        canvas.add(line);
      }
    };

    const handleMouseMove = (event: fabric.IEvent) => {
      const pointer = canvas.getPointer(event.e);

      if (
        toolMode === 'shape-square' &&
        startPointRef.current &&
        rectRef.current
      ) {
        const width = Math.abs(pointer.x - startPointRef.current.x);
        const height = Math.abs(pointer.y - startPointRef.current.y);
        rectRef.current.set({
          width: width,
          height: height,
        });
        isDraggingRef.current = true;
        canvas.renderAll();
      } else if (toolMode === 'shape-polygon' && activeLineRef.current) {
        // Update end point of active line
        activeLineRef.current.set({ x2: pointer.x, y2: pointer.y });
        canvas.renderAll();
      }
    };

    const handleMouseUp = () => {
      if (toolMode === 'shape-square' && rectRef.current) {
        if (!isDraggingRef.current) {
          // If not dragged, set to default size
          rectRef.current.set({ width: 100, height: 100 });
          canvas.renderAll();
        }
        startPointRef.current = null;
        rectRef.current = null;
        isDraggingRef.current = false;
        setToolMode('select');
      } else if (toolMode === 'text' || toolMode === 'one-seat') {
        // For single-click tools, switch back to select immediately
        setToolMode('select');
      }
      // Polygon does NOT reset on mouse up
    };

    const handleDoubleClick = () => {
      if (toolMode === 'shape-polygon') {
        const points = polygonPointsRef.current;
        if (points.length < 3) {
          // Not enough points for a polygon, cleanup
          linesRef.current.forEach(line => canvas.remove(line));
          if (activeLineRef.current) canvas.remove(activeLineRef.current);
        } else {
          // Remove temporary lines
          linesRef.current.forEach(line => canvas.remove(line));
          if (activeLineRef.current) canvas.remove(activeLineRef.current);

          // Create Polygon
          const polygon = new fabric.Polygon(points, {
            stroke: 'black',
            strokeWidth: 1,
            fill: 'rgba(0,0,0,0.1)', // Transparent gray
            objectCaching: false,
          });

          // Use applyCustomStyles if available, but it's not imported here yet. 
          // We'll stick to basics or import it if desired. 
          // For now, basic shapes. User can style it later if implemented.
          // Assuming standard styling from rect:
          // Actually rect uses createRect which sets some defaults.
          // We should make it selectable.

          canvas.add(polygon);
          canvas.setActiveObject(polygon);
        }

        // Reset state
        polygonPointsRef.current = [];
        linesRef.current = [];
        activeLineRef.current = null;
        setToolMode('select');
        canvas.renderAll();
      }
    };

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);
    canvas.on('mouse:dblclick', handleDoubleClick);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
      canvas.off('mouse:dblclick', handleDoubleClick);

      // Cleanup if component unmounts while drawing ?? 
      // Ideally we should but hooks are tricky. 
      // Existing code didn't do much cleanup on unmount for in-progress shapes.
    };
  }, [canvas, toolMode, setToolMode]);
};

export default useObjectCreator;
