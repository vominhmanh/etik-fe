import { useEffect } from 'react';
import { useEventGuiStore } from '@/zustand';
import useClipboardActions from './useClipboardActions';
import { CanvasObject } from '@/types/data.types';
import { exportCanvasToLiteJson } from '../utils/liteJsonExporter';

const useKeyboardShortcuts = (onSave?: (json: any) => void) => {
  const { canvas, setLastClickedPoint, undo, redo } = useEventGuiStore();
  const { copySelectedObjects, cutSelectedObjects, pasteObjects } =
    useClipboardActions();

  useEffect(() => {
    if (!canvas) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case 'c':
            e.preventDefault();
            copySelectedObjects();
            break;
          case 'x':
            e.preventDefault();
            cutSelectedObjects();
            break;
          case 'v':
            e.preventDefault();
            pasteObjects();
            break;
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case 'y':
            e.preventDefault();
            redo();
            break;
          case 's':
            e.preventDefault();
            if (onSave) {
              const rows = useEventGuiStore.getState().rows;
              // Assuming default size if width/height is not passed, ideally we should pass it or get it from style.
              // For shortcuts, we might need a way to get the current canvas dimensions or we can just pass default.
              // We'll pass 800, 600 as default, or we can get it from the canvas wrapper. For now, 800x600.
              const liteJson = exportCanvasToLiteJson(canvas, rows, 800, 600);
              onSave(liteJson as unknown as CanvasObject);
            }
            break;
        }
      } else {
        // Non-Ctrl shortcuts (Arrows, Esc)
        const activeObject = canvas.getActiveObject();
        const step = e.shiftKey ? 10 : 1; // Shift for larger jumps

        switch (e.key) {
          case 'Escape':
            e.preventDefault();
            canvas.discardActiveObject();
            canvas.requestRenderAll();
            break;
          case 'ArrowUp':
            if (activeObject) {
              e.preventDefault();
              activeObject.set('top', (activeObject.top || 0) - step);
              activeObject.setCoords();
              canvas.requestRenderAll();
              canvas.fire('object:modified', { target: activeObject });
            }
            break;
          case 'ArrowDown':
            if (activeObject) {
              e.preventDefault();
              activeObject.set('top', (activeObject.top || 0) + step);
              activeObject.setCoords();
              canvas.requestRenderAll();
              canvas.fire('object:modified', { target: activeObject });
            }
            break;
          case 'ArrowLeft':
            if (activeObject) {
              e.preventDefault();
              activeObject.set('left', (activeObject.left || 0) - step);
              activeObject.setCoords();
              canvas.requestRenderAll();
              canvas.fire('object:modified', { target: activeObject });
            }
            break;
          case 'ArrowRight':
            if (activeObject) {
              e.preventDefault();
              activeObject.set('left', (activeObject.left || 0) + step);
              activeObject.setCoords();
              canvas.requestRenderAll();
              canvas.fire('object:modified', { target: activeObject });
            }
            break;
        }
      }
    };

    const handleMouseDown = (event: fabric.IEvent) => {
      const pointer = canvas.getPointer(event.e);
      setLastClickedPoint({ x: pointer.x, y: pointer.y });
    };

    document.addEventListener('keydown', handleKeyDown);
    canvas.on('mouse:down', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      canvas.off('mouse:down', handleMouseDown);
    };
  }, [
    canvas,
    copySelectedObjects,
    cutSelectedObjects,
    pasteObjects,
    setLastClickedPoint,
    undo,
    redo,
    onSave,
  ]);
};

export default useKeyboardShortcuts;
