import { useEffect } from 'react';
import { fabric } from 'fabric';
import { createSeat } from '../components/createObject';

const useCanvasSetup = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  canvasParent: React.RefObject<HTMLDivElement>,
  setCanvas: (c: fabric.Canvas | null) => void,
  width: number = 800,
  height: number = 600,
  backgroundColor: string = '#f8fafc',
  allowSelection: boolean = true,
  responsive: boolean = true
) => {
  useEffect(() => {
    if (!canvasRef.current || !canvasParent.current) return;

    const c = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor,
      selection: allowSelection,
    });
    setCanvas(c);

    const resizeCanvas = () => {
      if (canvasParent.current) {
        const parent = canvasParent.current;
        if (parent) {
          const { width, height } = parent.getBoundingClientRect();
          const anyCanvas = c as any;
          if (!anyCanvas.lowerCanvasEl || !anyCanvas.upperCanvasEl) return;
          try {
            c.setDimensions({ width, height }, { cssOnly: false });
          } catch (err) {
            // eslint-disable-next-line no-console
            console.warn("[seat-picker] resizeCanvas setDimensions failed", err);
          }
        }
      }
    };

    if (responsive) {
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
    }

    const seat = createSeat(100, 100, 'A', '1');
    seat.angle = 45;
    // c.add(seat);

    // Object bounds clamping removed as per user request to allow moving objects outside the canvas.

    // Enforce strokeUniform: true for all supported objects on selection
    c.on('selection:created', (event) => {
      const objs = event.selected || (event.target ? [event.target] : []);
      objs.forEach((obj) => {
        if (
          typeof obj.type === 'string' &&
          ['rect', 'circle', 'i-text'].includes(obj.type)
        ) {
          obj.strokeUniform = true;
        }
      });
    });
    // Also enforce after loading from JSON (if needed)
    c.on('after:render', () => {
      c.getObjects().forEach((obj) => {
        if (
          typeof obj.type === 'string' &&
          ['rect', 'circle', 'i-text'].includes(obj.type)
        ) {
          obj.strokeUniform = true;
        }
      });
    });

    return () => {
      if (responsive) {
        window.removeEventListener('resize', resizeCanvas);
      }
      c.dispose();
      setCanvas(null);
    };
  }, [canvasRef, canvasParent, setCanvas, allowSelection, responsive]);
};

export default useCanvasSetup;
