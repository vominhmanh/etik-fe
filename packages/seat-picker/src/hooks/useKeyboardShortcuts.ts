import { useEffect } from 'react';
import { useEventGuiStore } from '@/zustand';
import useClipboardActions from './useClipboardActions';
import { CanvasObject } from '@/types/data.types';

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
              const json = {
                type: 'canvas',
                ...canvas.toJSON(['customType', 'seatData', 'zoneData']),
              } as unknown as CanvasObject;
              onSave(json);
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
