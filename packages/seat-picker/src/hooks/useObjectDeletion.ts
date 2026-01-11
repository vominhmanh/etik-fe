import { useEffect } from 'react';
import { fabric } from 'fabric';
import { Action } from '@/zustand/store/eventGuiStore';

const useObjectDeletion = (
  canvas: fabric.Canvas | null,
  toolAction: Action,
  notify?: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void
) => {
  useEffect(() => {
    if (!canvas) return;

    const deleteFunction = () => {
      const activeObject = canvas.getActiveObject();
      if (!activeObject) return;

      const objectsToDelete: fabric.Object[] = [];

      if (activeObject.type === 'activeSelection') {
        const activeSelection = activeObject as fabric.ActiveSelection;
        objectsToDelete.push(...activeSelection.getObjects());
      } else {
        objectsToDelete.push(activeObject);
      }

      // Check for protected seats (sold/held)
      const protectedSeats: fabric.Object[] = [];
      const deletableObjects: fabric.Object[] = [];

      objectsToDelete.forEach((obj: any) => {
        // Check if object is a seat with protected status
        const isSeat = obj.rowLabel || obj.seatNumber || (obj.customType === 'seat') || (obj.type === 'group' && obj.getObjects().some((o: any) => o.type === 'circle'));

        if (isSeat) {
          const status = obj.status || obj.attributes?.status;
          if (['sold', 'held'].includes(status)) {
            protectedSeats.push(obj);
            return;
          }
        }
        deletableObjects.push(obj);
      });

      if (protectedSeats.length > 0) {
        if (notify) {
          notify(`${protectedSeats.length} seat(s) are 'sold' or 'held' and cannot be deleted.`, 'warning');
        } else {
          alert(`${protectedSeats.length} seat(s) are 'sold' or 'held' and cannot be deleted.`);
        }
      }

      if (deletableObjects.length > 0) {
        deletableObjects.forEach((obj) => canvas.remove(obj));
        canvas.discardActiveObject();
        canvas.renderAll();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === 'Delete' ||
        (event.ctrlKey && event.key.toLowerCase() === 'd')
      ) {
        deleteFunction();
      }
    };

    if (toolAction === 'delete') {
      deleteFunction();
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [canvas, toolAction]);
};

export default useObjectDeletion;
