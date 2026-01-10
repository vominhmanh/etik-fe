import { useEventGuiStore } from '@/zustand';
import { fabric } from 'fabric';
import { v4 as uuidv4 } from 'uuid';
import { applyCustomStyles } from '@/components/createObject/applyCustomStyles';

const useClipboardActions = () => {
  const {
    canvas,
    clipboard,
    setClipboard,
    setToolAction,
    rows,
    addRow,
  } = useEventGuiStore();

  const CUSTOM_PROPS = [
    'id',
    'rowId',
    'seatNumber',
    'isRowLabel',
    'selectable',
    'evented',
    'lockMovementX',
    'lockMovementY',
    'customType',
    'stroke',
    'strokeWidth',
  ];

  // :::::::::::::::::::::::::: Function: copy objects
  const copySelectedObjects = async () => {
    if (!canvas) return;

    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length === 0) return;

    setToolAction('copy');

    // Identify rows involved in the selection
    const rowIds = new Set<string>();
    activeObjects.forEach((obj: any) => {
      if (obj.rowId) rowIds.add(obj.rowId);
    });

    // Create a Set of objects to clone, starting with the user's selection
    const objectsToClone = new Set<fabric.Object>(activeObjects);

    // If we have rows selected, ensure their labels are included
    if (rowIds.size > 0) {
      canvas.getObjects().forEach((obj: any) => {
        if (obj.isRowLabel && obj.rowId && rowIds.has(obj.rowId)) {
          objectsToClone.add(obj);
        }
      });
    }

    const clonedObjects: fabric.Object[] = [];
    for (const obj of Array.from(objectsToClone)) {
      await new Promise<void>((resolve) => {
        obj.clone((cloned: fabric.Object) => {
          if ('id' in cloned) (cloned as any).id = uuidv4();
          clonedObjects.push(cloned);
          resolve();
        }, CUSTOM_PROPS);
      });
    }
    setClipboard(clonedObjects);
  };

  // :::::::::::::::::::::::::: Function: cut objects
  const cutSelectedObjects = async () => {
    if (!canvas) return;

    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length === 0) return;

    setToolAction('cut');

    const clonedObjects: fabric.Object[] = [];
    for (const obj of activeObjects) {
      await new Promise<void>((resolve) => {
        obj.clone((cloned: fabric.Object) => {
          if ('id' in cloned) (cloned as any).id = uuidv4();
          clonedObjects.push(cloned);
          resolve();
        }, CUSTOM_PROPS);
      });
    }
    setClipboard(clonedObjects);

    canvas.remove(...activeObjects);
    canvas.discardActiveObject();
    canvas.renderAll();
  };

  // :::::::::::::::::::::::::: Function: paste objects
  const pasteObjects = async () => {
    if (!canvas || !clipboard) return;

    setToolAction('paste');

    const rowIdMap = new Map<string, string>();
    const pendingClones: Promise<fabric.Object | null>[] = [];

    // 1. Create Clones first
    for (const obj of clipboard) {
      pendingClones.push(
        new Promise((resolve) => {
          obj.clone((cloned: any) => {
            cloned.id = uuidv4();

            // Handle Row Logic
            if (cloned.rowId) {
              const oldRowId = cloned.rowId;
              if (!rowIdMap.has(oldRowId)) {
                const newRowId = uuidv4();
                rowIdMap.set(oldRowId, newRowId);

                const oldRowData = rows.find((r) => r.id === oldRowId);
                if (oldRowData) {
                  addRow({
                    ...oldRowData,
                    id: newRowId,
                    name: oldRowData.name,
                  });
                } else {
                  addRow({ id: newRowId, name: 'Row' });
                }
              }
              cloned.rowId = rowIdMap.get(oldRowId);
            }

            // Handle Row Label Logic
            // We include the label in the paste so it becomes part of the ActiveSelection.
            if (cloned.isRowLabel && cloned.rowId) {
              // Deduce side from originX
              // Left Label: originX = 'right'
              // Right Label: originX = 'left'
              let side = 'left';
              if (cloned.originX === 'left') {
                side = 'right';
              }

              cloned.id = `label-${side}-${cloned.rowId}`;
              cloned.set({
                selectable: true,
                evented: true,
                lockMovementX: true,
                lockMovementY: true,
              });
            }

            applyCustomStyles(cloned);
            resolve(cloned);
          }, CUSTOM_PROPS);
        })
      );
    }

    const validObjects = (await Promise.all(pendingClones)).filter(
      (obj): obj is fabric.Object => obj !== null
    );

    // Sort objects: Row Labels FIRST
    // This ensures they are added to the canvas before the seats, helping the renderer
    // (triggered by object:added) to find them immediately.
    validObjects.sort((a, b) => {
      const isLabelA = (a as any).isRowLabel ? -1 : 1;
      const isLabelB = (b as any).isRowLabel ? -1 : 1;
      return isLabelA - isLabelB;
    });

    // 2. Calculate Bounds and Clamp
    const bbox = getBoundingBox(validObjects);
    const canvasW = canvas.getWidth();
    const canvasH = canvas.getHeight();

    let dx = 20;
    let dy = 20;

    if (bbox.left + bbox.width + dx > canvasW) {
      dx = canvasW - (bbox.left + bbox.width) - 20;
    }
    if (bbox.top + bbox.height + dy > canvasH) {
      dy = canvasH - (bbox.top + bbox.height) - 20;
    }
    if (bbox.left + dx < 0) dx = -bbox.left + 20;
    if (bbox.top + dy < 0) dy = -bbox.top + 20;

    // 3. Apply Offset and Add to Canvas
    validObjects.forEach((obj) => {
      obj.set({
        left: (obj.left || 0) + dx,
        top: (obj.top || 0) + dy,
        evented: true,
        selectable: true,
      });
      canvas.add(obj);
    });

    // 4. Select all pasted objects (Seats + Labels)
    if (validObjects.length === 1) {
      canvas.setActiveObject(validObjects[0]);
    } else if (validObjects.length > 1) {
      const selection = new fabric.ActiveSelection(validObjects, { canvas });
      canvas.setActiveObject(selection);
    }
    canvas.requestRenderAll();
  };

  const getBoundingBox = (objects: fabric.Object[]) => {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    objects.forEach((obj) => {
      const objBoundingRect = obj.getBoundingRect();
      minX = Math.min(minX, objBoundingRect.left);
      minY = Math.min(minY, objBoundingRect.top);
      maxX = Math.max(maxX, objBoundingRect.left + objBoundingRect.width);
      maxY = Math.max(maxY, objBoundingRect.top + objBoundingRect.height);
    });

    return { left: minX, top: minY, width: maxX - minX, height: maxY - minY };
  };

  return { copySelectedObjects, cutSelectedObjects, pasteObjects };
};

export default useClipboardActions;

// // import '../fabricCustomRegistration';
// import { useEventGuiStore } from '@/zustand';
// import { fabric } from 'fabric';
// import React, { useRef } from 'react';

// function useRegisterFabricCustomClasses() {
//   const registered = useRef(false);
//   if (!registered.current) {
//     if (!(fabric as any).CustomRect) {
//       (fabric as any).CustomRect = CustomRect;
//       (CustomRect as any).fromObject = function (object: any, callback: any) {
//         return fabric.Object._fromObject(CustomRect, object, callback);
//       };
//     }
//     if (!(fabric as any).CustomCircle) {
//       (fabric as any).CustomCircle = CustomCircle;
//       (CustomCircle as any).fromObject = function (object: any, callback: any) {
//         return fabric.Object._fromObject(CustomCircle, object, callback);
//       };
//     }
//     if (!(fabric as any).CustomText) {
//       (fabric as any).CustomText = CustomText;
//       (CustomText as any).fromObject = function (object: any, callback: any) {
//         return fabric.Object._fromObject(CustomText, object, callback);
//       };
//     }
//     registered.current = true;
//   }
// }

// const PASTE_OFFSET = 25;

// const useClipboardActions = () => {
//   useRegisterFabricCustomClasses();
//   const { canvas, setToolAction } = useEventGuiStore();
//   // Local clipboard and paste count
//   const clipboardRef = React.useRef<fabric.Object[] | null>(null);
//   const pasteCountRef = React.useRef(0);

//   // Copy selected objects
//   const copySelectedObjects = () => {
//     if (!canvas) return;
//     const activeObjects = canvas.getActiveObjects();
//     if (activeObjects.length === 0) return;
//     setToolAction('copy');
//     // Deep clone for clipboard
//     clipboardRef.current = activeObjects.map((obj) =>
//       obj.clone ? obj.clone() : fabric.util.object.clone(obj)
//     );
//     pasteCountRef.current = 0;
//   };

//   // Cut selected objects
//   const cutSelectedObjects = () => {
//     if (!canvas) return;
//     const activeObjects = canvas.getActiveObjects();
//     if (activeObjects.length === 0) return;
//     setToolAction('cut');
//     clipboardRef.current = activeObjects.map((obj) =>
//       obj.clone ? obj.clone() : fabric.util.object.clone(obj)
//     );
//     pasteCountRef.current = 0;
//     canvas.remove(...activeObjects);
//     canvas.discardActiveObject();
//     canvas.renderAll();
//   };

//   // Paste objects with offset
//   const pasteObjects = () => {
//     if (!canvas || !clipboardRef.current || clipboardRef.current.length === 0)
//       return;
//     setToolAction('paste');
//     // Clone objects for pasting
//     const pastedObjects = clipboardRef.current.map((obj) =>
//       obj.clone ? obj.clone() : fabric.util.object.clone(obj)
//     );
//     // Compute bounding box of originals
//     const boundingBox = getBoundingBox(pastedObjects);
//     const canvasWidth = canvas.getWidth();
//     const canvasHeight = canvas.getHeight();
//     // Offset increases with each paste
//     const offset = PASTE_OFFSET * (pasteCountRef.current + 1);
//     let newLeft = boundingBox.left + offset;
//     let newTop = boundingBox.top + offset;
//     // Clamp to canvas
//     if (newLeft + boundingBox.width > canvasWidth)
//       newLeft = canvasWidth - boundingBox.width;
//     if (newLeft < 0) newLeft = 0;
//     if (newTop + boundingBox.height > canvasHeight)
//       newTop = canvasHeight - boundingBox.height;
//     if (newTop < 0) newTop = 0;
//     const actualOffsetX = newLeft - boundingBox.left;
//     const actualOffsetY = newTop - boundingBox.top;
//     // Place and add to canvas
//     pastedObjects.forEach((obj) => {
//       obj.set({
//         left: (obj.left || 0) + actualOffsetX,
//         top: (obj.top || 0) + actualOffsetY,
//         evented: true,
//         selectable: true,
//       });
//       canvas.add(obj);
//     });
//     // Select pasted objects
//     canvas.discardActiveObject();
//     if (pastedObjects.length === 1) {
//       canvas.setActiveObject(pastedObjects[0]);
//     } else if (pastedObjects.length > 1) {
//       const group = new fabric.ActiveSelection(pastedObjects, { canvas });
//       canvas.setActiveObject(group);
//     }
//     canvas.requestRenderAll();
//     pasteCountRef.current += 1;
//   };

//   // Helper: get bounding box
//   const getBoundingBox = (objects: fabric.Object[]) => {
//     let minX = Infinity,
//       minY = Infinity,
//       maxX = -Infinity,
//       maxY = -Infinity;
//     objects.forEach((obj) => {
//       const rect = obj.getBoundingRect();
//       minX = Math.min(minX, rect.left);
//       minY = Math.min(minY, rect.top);
//       maxX = Math.max(maxX, rect.left + rect.width);
//       maxY = Math.max(maxY, rect.top + rect.height);
//     });
//     return { left: minX, top: minY, width: maxX - minX, height: maxY - minY };
//   };

//   return { copySelectedObjects, cutSelectedObjects, pasteObjects };
// };

// export default useClipboardActions;
// export { useRegisterFabricCustomClasses };
