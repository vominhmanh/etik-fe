import { useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import { useEventGuiStore } from '@/zustand/store/eventGuiStore';

const useSelectionHandler = (canvas: fabric.Canvas | null) => {
  const { selectedRowId, setSelectedRowId } = useEventGuiStore();
  const ignoreNextSelectionRef = useRef(false);

  useEffect(() => {
    if (!canvas) return;

    const handleMouseDown = (e: fabric.IEvent) => {
      // Clear selection if clicked on empty space
      if (!e.target) {
        setSelectedRowId(null);
      }
    };

    const handleDoubleClick = (e: fabric.IEvent) => {
      const activeObject = canvas.getActiveObject();
      // If we have a row group selected, find the clicked seat and select it directly
      if (
        activeObject &&
        activeObject.type === 'activeSelection' &&
        selectedRowId
      ) {
        // Set flag to ignore the immediate selection event triggered by setActiveObject below
        ignoreNextSelectionRef.current = true;

        // Break the group to restore object coordinates
        canvas.discardActiveObject();

        // Hide Row Panel
        setSelectedRowId(null);

        // Find the specific object under the mouse
        const target = canvas.findTarget(e.e, false);

        if (target && typeof (target as any).rowId === 'string') {
          canvas.setActiveObject(target);
          canvas.requestRenderAll();
        }
      }
    };

    const handleSelection = (e: fabric.IEvent) => {
      // If we triggered this selection via double-click breakdown, ignore auto-grouping
      if (ignoreNextSelectionRef.current) {
        ignoreNextSelectionRef.current = false;
        return;
      }

      const selected = canvas.getActiveObjects();

      if (selected.length === 0) {
        // Handled by mouse:down/cleared, but safe to ignore here
        return;
      }

      // Check if it's a single seat selection
      if (
        selected.length === 1 &&
        typeof (selected[0] as any).rowId === 'string'
      ) {
        const obj = selected[0] as any;
        const currentRowId = obj.rowId;

        // If newly selected row (different from previous), select the whole row
        if (selectedRowId !== currentRowId) {
          const rowObjects = canvas
            .getObjects()
            .filter((o: any) => o.rowId === currentRowId);

          if (rowObjects.length > 1) {
            const selection = new fabric.ActiveSelection(rowObjects, {
              canvas: canvas,
            });
            canvas.setActiveObject(selection);
            setSelectedRowId(currentRowId);
            canvas.requestRenderAll();
            return;
          } else {
            setSelectedRowId(currentRowId);
          }
        }
      } else {
        // Multi selection
        const rowIds = new Set(
          selected.map((o: any) => o.rowId).filter(Boolean)
        );
        if (rowIds.size === 1) {
          const id = Array.from(rowIds)[0] as string;

          // Check if FULL row is selected (exclude labels)
          const allRowObjects = canvas
            .getObjects()
            .filter((o: any) => o.rowId === id && !o.isRowLabel);
          const selectedSeats = selected.filter((o: any) => !o.isRowLabel);

          if (selectedSeats.length === allRowObjects.length) {
            if (selectedRowId !== id) {
              setSelectedRowId(id);
            }
          } else {
            setSelectedRowId(null);
          }
        } else {
          setSelectedRowId(null);
        }
      }

      // Apply styling
      const activeObject = canvas.getActiveObject();
      if (activeObject && activeObject.type === 'activeSelection') {
        activeObject.setControlsVisibility({
          mt: false,
          mb: false,
          ml: false,
          mr: false,
        });

        activeObject.borderColor = 'green';
        activeObject.borderDashArray = [2, 4];
        activeObject.padding = 4;
        activeObject.cornerColor = 'lightblue';
        activeObject.cornerSize = 7;
        activeObject.cornerStrokeColor = 'blue';
        canvas.requestRenderAll();
      }
    };

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:dblclick', handleDoubleClick);
    canvas.on('selection:created', handleSelection);
    canvas.on('selection:updated', handleSelection);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:dblclick', handleDoubleClick);
      canvas.off('selection:created', handleSelection);
      canvas.off('selection:updated', handleSelection);
    };
  }, [canvas, selectedRowId, setSelectedRowId]);
};

export default useSelectionHandler;