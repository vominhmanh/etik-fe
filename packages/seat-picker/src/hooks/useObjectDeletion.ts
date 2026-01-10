import { useEffect } from 'react';
import { fabric } from 'fabric';
import { Action } from '@/zustand/store/eventGuiStore';

const useObjectDeletion = (
  canvas: fabric.Canvas | null,
  toolAction: Action
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

      // Check for protected seats
      const protectedSeats = objectsToDelete.filter((obj: any) => {
        if (obj.type === 'circle' && obj.customType === 'seat') {
          const status = obj.status || 'available';
          return status === 'sold' || status === 'hold' || status === 'booked';
        }
        return false;
      });

      if (protectedSeats.length > 0) {
        const firstSeat = protectedSeats[0] as any;
        const seatLabel = firstSeat.seatNumber || (firstSeat.attributes?.number) || 'Ghế';
        const rowLabel = firstSeat.rowId || (firstSeat.attributes?.row) || '?';
        alert(`Không thể xóa: ${seatLabel} hàng ${rowLabel} có trạng thái ${firstSeat.status || 'đã đặt'}.`);
        return;
      }

      objectsToDelete.forEach((obj) => canvas.remove(obj));

      canvas.discardActiveObject();
      canvas.renderAll();
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
