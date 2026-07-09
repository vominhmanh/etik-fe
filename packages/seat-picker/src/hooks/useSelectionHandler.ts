import { useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import { useEventGuiStore } from '@/zustand/store/eventGuiStore';

const useSelectionHandler = (canvas: fabric.Canvas | null) => {
  const { selectedRowIds, setSelectedRowIds, toolMode, setToolMode } =
    useEventGuiStore();
  const ignoreNextSelectionRef = useRef(false);

  useEffect(() => {
    if (!canvas) return;

    const handleMouseDown = (e: fabric.IEvent) => {
      // Clear selection if clicked on empty space
      if (!e.target) {
        setSelectedRowIds([]);
        // Auto-revert to Row Selection mode when clearing selection
        if (toolMode === 'select-seat') {
          setToolMode('select');
        }
      }
    };

    const handleDoubleClick = (e: fabric.IEvent) => {
      // Switch mode to 'select-seat' on double click
      setToolMode('select-seat');

      const activeObject = canvas.getActiveObject();
      // If we have a row group selected, find the clicked seat and select it directly
      if (
        activeObject &&
        activeObject.type === 'activeSelection' &&
        selectedRowIds.length > 0
      ) {
        // Set flag to ignore the immediate selection event triggered by setActiveObject below
        ignoreNextSelectionRef.current = true;

        // Break the group to restore object coordinates
        canvas.discardActiveObject();

        // Hide Row Panel
        setSelectedRowIds([]);

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

      if (toolMode === 'select-seat') {
        if (selectedRowIds.length > 0) setSelectedRowIds([]);
      } else if (toolMode === 'select') {
        const selectedEventObjects = (e as any).selected || [];
        const deselectedEventObjects = (e as any).deselected || [];

        const isSingleClickInteraction = 
          (selectedEventObjects.length === 1 && deselectedEventObjects.length === 0) ||
          (deselectedEventObjects.length === 1 && selectedEventObjects.length === 0) ||
          (selectedEventObjects.length === 0 && deselectedEventObjects.length === 0 && selected.length === 1);

        if (isSingleClickInteraction) {
            const newlySelectedRowIds = new Set<string>();
            selectedEventObjects.forEach((o: any) => {
              if (o.rowId) newlySelectedRowIds.add(o.rowId);
            });
            if (newlySelectedRowIds.size === 0 && selected.length === 1 && selected[0].rowId) {
                newlySelectedRowIds.add(selected[0].rowId);
            }

            const newlyDeselectedRowIds = new Set<string>();
            deselectedEventObjects.forEach((o: any) => {
              if (o.rowId) newlyDeselectedRowIds.add(o.rowId);
            });

            let needsReselection = false;
            const newSelectionObjects = new Set(selected);

            const objectsByRow = new Map<string, any[]>();
            const processedObjs1 = new Set<any>();

            const addToRow1 = (o: any) => {
              if (o.rowId) {
                if (!objectsByRow.has(o.rowId)) objectsByRow.set(o.rowId, []);
                objectsByRow.get(o.rowId)!.push(o);
              }
            };

            canvas.getObjects().forEach((o: any) => {
              if (!processedObjs1.has(o)) {
                processedObjs1.add(o);
                addToRow1(o);
              }
            });
            selected.forEach((o: any) => {
              if (!processedObjs1.has(o)) {
                processedObjs1.add(o);
                addToRow1(o);
              }
            });

            newlyDeselectedRowIds.forEach(id => {
              const allRowObjects = objectsByRow.get(id as string) || [];
              allRowObjects.forEach(obj => {
                 if (newSelectionObjects.has(obj)) {
                     newSelectionObjects.delete(obj);
                     needsReselection = true;
                 }
              });
            });

            newlySelectedRowIds.forEach(id => {
              const allRowObjects = objectsByRow.get(id as string) || [];
              allRowObjects.forEach(obj => {
                 if (!newSelectionObjects.has(obj)) {
                     newSelectionObjects.add(obj);
                     needsReselection = true;
                 }
              });
            });

            if (needsReselection) {
              canvas.discardActiveObject();
              if (newSelectionObjects.size > 0) {
                const selection = new fabric.ActiveSelection(Array.from(newSelectionObjects), {
                  canvas: canvas,
                });
                canvas.setActiveObject(selection);
              }
              canvas.requestRenderAll();
              return;
            }
        }

        // Common Logic: Identify fully selected rows for Sidebar properties
        const objectsByRow = new Map<string, any[]>();
        const processedObjs2 = new Set<any>();

        const addToRow2 = (o: any) => {
          if (o.rowId && !o.isRowLabel) {
            if (!objectsByRow.has(o.rowId)) objectsByRow.set(o.rowId, []);
            objectsByRow.get(o.rowId)!.push(o);
          }
        };

        canvas.getObjects().forEach((o: any) => {
          if (!processedObjs2.has(o)) {
            processedObjs2.add(o);
            addToRow2(o);
          }
        });
        selected.forEach((o: any) => {
          if (!processedObjs2.has(o)) {
            processedObjs2.add(o);
            addToRow2(o);
          }
        });

        const selectedSeatsByRow = new Map<string, any[]>();
        selected.forEach((o: any) => {
          if (o.rowId && !o.isRowLabel) {
            if (!selectedSeatsByRow.has(o.rowId)) selectedSeatsByRow.set(o.rowId, []);
            selectedSeatsByRow.get(o.rowId)!.push(o);
          }
        });

        const fullySelectedRowIds: string[] = [];
        selectedSeatsByRow.forEach((selSeats, rowId) => {
           const allRowSeats = objectsByRow.get(rowId) || [];
           if (allRowSeats.length > 0 && selSeats.length === allRowSeats.length) {
               fullySelectedRowIds.push(rowId);
           }
        });

        if (selectedRowIds.length !== fullySelectedRowIds.length || !fullySelectedRowIds.every(id => selectedRowIds.includes(id))) {
          setSelectedRowIds(fullySelectedRowIds);
        }
      }

      // Apply styling
      const activeObject = canvas.getActiveObject();
      if (activeObject && activeObject.type === 'activeSelection') {
        activeObject.setControlsVisibility({
          mt: true,
          mb: true,
          ml: true,
          mr: true,
          bl: true,
          br: true,
          tl: true,
          tr: true,
          mtr: true,
        });

        activeObject.set('lockUniScaling', false);

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
  }, [canvas, selectedRowIds, setSelectedRowIds, toolMode, setToolMode]);
};

export default useSelectionHandler;