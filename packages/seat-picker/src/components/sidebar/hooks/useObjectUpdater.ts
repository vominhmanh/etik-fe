import { fabric } from 'fabric';
import { CustomFabricObject } from '@/types/fabric-types';
import { Properties } from './useObjectProperties';
import { useEventGuiStore } from '@/zustand/store/eventGuiStore';
import { useEffect } from 'react';

export const useObjectUpdater = (
  canvas: fabric.Canvas | null,
  setProperties: React.Dispatch<React.SetStateAction<Properties>>,
  lockAspect: boolean = false
) => {
  const { updateRow } = useEventGuiStore();

  // --- Effect: Listen for scaling circles and update radius ---
  useEffect(() => {
    if (!canvas) return;
    const handleScaling = (e: fabric.IEvent) => {
      const obj = e.target as CustomFabricObject;
      if (!obj) return;

      // Handle Seat Group Scaling
      if (obj.type === 'group' && (obj.rowId || obj.seatNumber)) {
        const group = obj as fabric.Group;
        const circle = group.getObjects().find(o => o.type === 'circle') as CustomFabricObject;
        if (circle) {
          const scale = group.scaleX || 1;
          const visualRadius = (circle.radius || 0) * scale;
          setProperties((prev) => ({ ...prev, radius: visualRadius }));
        }
        return;
      }

      // Handle Spacing-Only Scaling for Selections
      if (obj.type === 'activeSelection' && 'getObjects' in obj) {
        const selection = obj as fabric.ActiveSelection;
        const objects = selection.getObjects() as CustomFabricObject[];
        const hasSeats = objects.some(o => (o.type === 'group' && (o.rowId || o.seatNumber)) || o.type === 'circle');

        if (hasSeats) {
          const sx = obj.scaleX || 1;
          const sy = obj.scaleY || 1;
          objects.forEach(child => {
            child.set({
              scaleX: 1 / sx,
              scaleY: 1 / sy
            });
          });
          return;
        }
      }

      if (obj.type === 'circle') {
        // Single circle scaling
        const newRadius =
          (obj.radius || (obj.width ? obj.width / 2 : 0)) * (obj.scaleX || 1);
        obj.set({
          radius: newRadius,
          scaleX: 1,
          scaleY: 1,
          width: newRadius * 2,
          height: newRadius * 2,
        });
        obj.setCoords();
        canvas.renderAll();
        setProperties((prev) => ({ ...prev, radius: newRadius }));
      } else if (obj.type === 'activeSelection' && 'getObjects' in obj) {
        // Group scaling
        const selection = obj as fabric.ActiveSelection;
        const circles = (selection.getObjects() as CustomFabricObject[]).filter(
          (o) => o.type === 'circle'
        );
        let radii: number[] = [];
        circles.forEach((circle) => {
          const newRadius =
            (circle.radius || (circle.width ? circle.width / 2 : 0)) *
            (circle.scaleX || 1);
          circle.set({
            radius: newRadius,
            scaleX: 1,
            scaleY: 1,
            width: newRadius * 2,
            height: newRadius * 2,
          });
          circle.setCoords();
          radii.push(newRadius);
        });
        canvas.renderAll();
        // If all radii are the same, show it, else show 'mixed'
        const allSame = radii.every((r) => r === radii[0]);
        setProperties((prev) => ({
          ...prev,
          radius: allSame ? radii[0] : 'mixed',
        }));
      }
    };

    const handleModified = (e: fabric.IEvent) => {
      const obj = e.target as CustomFabricObject;
      if (obj?.type === 'activeSelection' && (obj.scaleX !== 1 || obj.scaleY !== 1)) {
        const selection = obj as fabric.ActiveSelection;
        const objects = selection.getObjects() as CustomFabricObject[];
        const hasSeats = objects.some(o => (o.type === 'group' && (o.rowId || o.seatNumber)) || o.type === 'circle');

        if (hasSeats) {
          const savedObjects = [...objects];
          canvas.discardActiveObject();
          const newSel = new fabric.ActiveSelection(savedObjects, { canvas: canvas });
          canvas.setActiveObject(newSel);
          canvas.requestRenderAll();
        }
      }
    };

    canvas.on('object:scaling', handleScaling);
    canvas.on('object:modified', handleModified);
    return () => {
      canvas.off('object:scaling', handleScaling);
      canvas.off('object:modified', handleModified);
    };
  }, [canvas, setProperties]);

  const updateObject = (updates: Partial<Properties>) => {
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    const activeObjects = canvas.getActiveObjects() as CustomFabricObject[];
    if (activeObjects.length === 0) return;

    // Handle group move and rotation
    if (activeObject && activeObject.type === 'activeSelection') {
      const group = activeObject as fabric.ActiveSelection;
      // Handle group move
      if ('left' in updates || 'top' in updates) {
        const deltaX =
          'left' in updates && typeof updates.left === 'number'
            ? updates.left - (group.left ?? 0)
            : 0;
        const deltaY =
          'top' in updates && typeof updates.top === 'number'
            ? updates.top - (group.top ?? 0)
            : 0;
        group.getObjects().forEach((obj: fabric.Object) => {
          obj.set({
            left: (obj.left ?? 0) + deltaX,
            top: (obj.top ?? 0) + deltaY,
          });
          obj.setCoords();
        });
        group.setCoords();
        canvas.renderAll();
        setProperties((prev) => ({
          ...prev,
          left: updates.left ?? prev.left,
          top: updates.top ?? prev.top,
        }));
        return;
      }
      // Handle group rotation
      if ('angle' in updates && typeof updates.angle === 'number') {
        group.set('angle', updates.angle);
        group.setCoords();
        canvas.renderAll();
        setProperties((prev) => ({
          ...prev,
          angle: updates.angle ?? prev.angle,
        }));
        return;
      }
    }

    const effectiveUpdates: Partial<Properties> = {};
    let shouldRender = false;

    activeObjects.forEach((selectedObject) => {
      const updatedProperties: Partial<CustomFabricObject> = {};
      for (const [key, value] of Object.entries(updates)) {
        if (selectedObject[key as keyof CustomFabricObject] !== value) {
          updatedProperties[key as keyof CustomFabricObject] = value;
        }
      }

      // Ensure stroke is always a string when it's being updated
      if (
        'stroke' in updatedProperties &&
        updatedProperties.stroke !== undefined
      ) {
        updatedProperties.stroke = String(updatedProperties.stroke);
      }

      // Special handling for Seat Groups (Radius Update)
      if (selectedObject.type === 'group' && (selectedObject.rowId || selectedObject.seatNumber)) {
        const group = selectedObject as fabric.Group;

        if ('radius' in updates && typeof updates.radius === 'number') {
          const circle = group.getObjects().find(o => o.type === 'circle') as CustomFabricObject;
          if (circle) {
            const scale = group.scaleX || 1;
            const newBaseRadius = updates.radius / scale;

            circle.set({
              radius: newBaseRadius,
              width: newBaseRadius * 2,
              height: newBaseRadius * 2
            });
            // Trigger group recalc to fit new circle size
            group.addWithUpdate();
          }
          delete updatedProperties.radius;
        }

        if ('fontSize' in updates && typeof updates.fontSize === 'number') {
          const textObj = group.getObjects().find(o => o.type === 'text' || o.type === 'i-text');
          if (textObj) {
            (textObj as fabric.Text).set({ fontSize: updates.fontSize });
            group.addWithUpdate();
          }
          delete updatedProperties.fontSize;
        }

        if ('fill' in updates) {
          const circle = group.getObjects().find(o => o.type === 'circle') as CustomFabricObject;
          if (circle) {
            circle.set({ fill: updates.fill });
          }
          // Remove fill from updatedProperties to prevent it from being set on the group itself if unexpected
          delete updatedProperties.fill;
          group.addWithUpdate();
        }

        if ('stroke' in updates) {
          const circle = group.getObjects().find(o => o.type === 'circle') as CustomFabricObject;
          if (circle) {
            (circle as fabric.Object).set({ stroke: String(updates.stroke) });
          }
          delete updatedProperties.stroke;
          group.addWithUpdate();
        }

        if ('status' in updates) {
          const status = updates.status;

          // Remove existing status icons
          const existingIcons = group.getObjects().filter(o => o.name === 'status_icon');
          existingIcons.forEach(icon => group.remove(icon)); // Use remove instead of removeWithUpdate inside loop

          // Add new icon if needed
          let iconPath = '';
          if (status === 'blocked') {
            // Lock icon
            iconPath = 'M12 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm6-9h-1V6a5 5 0 0 0-10 0v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2zM9 6a3 3 0 1 1 6 0v2H9V6z';
          } else if (status === 'held') {
            // Hourglass icon
            iconPath = 'M6 2v6h.01L6 8.01 10 12l-4 4 .01.01H6V22h12v-5.99h-.01L18 16l-4-4 4-3.99-.01-.01H18V2H6z';
          } else if (status === 'sold') {
            // User icon
            iconPath = 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z';
          }

          if (iconPath) {
            const path = new fabric.Path(iconPath, {
              fill: '#ffffff',
              scaleX: 0.5,
              scaleY: 0.5,
              originX: 'center',
              originY: 'center',
              name: 'status_icon',
              opacity: 0.9,
              shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.5)', blur: 2 })
            });

            const circle = group.getObjects().find(o => o.type === 'circle') as CustomFabricObject;
            if (circle) {
              const radius = (circle as any).radius || 10;
              // Scale icon to be roughly 60% of diameter (approximate visual check)
              // Path dimensions typically ~24x24 for these SVGs
              const iconSize = Math.max(path.width || 0, path.height || 0);
              if (iconSize > 0) {
                const targetSize = radius * 1.2;
                const scale = targetSize / iconSize;
                path.set({ scaleX: scale, scaleY: scale });
              }
              // Center icon relative to circle (which is usually at 0,0 in group)
              path.set({ left: circle.left, top: circle.top });
            }

            group.add(path);
          }
          group.addWithUpdate();
        }
      }

      // Special handling for circle objects - only use radius
      if (selectedObject.type === 'circle') {
        // Handle explicit Radius update
        if ('radius' in updates && typeof updates.radius === 'number') {
          const r = updates.radius;
          selectedObject.set({
            radius: r,
            width: r * 2,
            height: r * 2,
            scaleX: 1,
            scaleY: 1
          });
          selectedObject.setCoords();
        }

        if ('width' in updates || 'height' in updates) {
          const currentRadius = selectedObject.radius || 0;
          const newRadius = updates.width
            ? updates.width / 2
            : updates.height
              ? updates.height / 2
              : currentRadius;
          selectedObject.set({
            radius: newRadius,
            scaleX: 1,
            scaleY: 1,
            width: newRadius * 2,
            height: newRadius * 2,
          });
          delete updatedProperties.width;
          delete updatedProperties.height;
        }
      } else {
        // Special handling for width/height for non-circle objects
        if ('width' in updates && updates.width !== undefined) {
          const renderedWidth = updates.width;
          const currentScaleX = selectedObject.scaleX || 1;
          selectedObject.set({
            width: renderedWidth / currentScaleX,
            scaleX: 1,
            height: lockAspect
              ? renderedWidth / currentScaleX
              : selectedObject.height,
          });
          delete updatedProperties.width;
        }
        if ('height' in updates && updates.height !== undefined) {
          const renderedHeight = updates.height;
          const currentScaleY = selectedObject.scaleY || 1;
          selectedObject.set({
            height: renderedHeight / currentScaleY,
            scaleY: 1,
            width: lockAspect
              ? renderedHeight / currentScaleY
              : selectedObject.width,
          });
          delete updatedProperties.height;
        }
      }

      // Special handling for seatNumber in groups (sync to text object)
      if ('seatNumber' in updates && selectedObject.type === 'group') {
        const group = selectedObject as fabric.Group;
        const objects = group.getObjects();
        const textObj = objects.find(
          (o) => o.type === 'text' || o.type === 'i-text'
        ) as fabric.Text;

        if (textObj) {
          textObj.set('text', String(updates.seatNumber));
          group.addWithUpdate(); // important to refresh group bounds/cache
        }
      }

      selectedObject.set(updatedProperties);

      // :::::::::::: Ensures the text's scales remains 1, only font-size should change
      if (selectedObject.type === 'i-text') {
        selectedObject.set({
          scaleX: 1,
          scaleY: 1,
        });
      }

      // --- Improved auto-snap to canvas edge after rotation ---
      if (Object.prototype.hasOwnProperty.call(updates, 'angle')) {
        selectedObject.setCoords(); // recalculate coords after rotation
        const rect = selectedObject.getBoundingRect();
        const canvasWidth = canvas.getWidth();
        const canvasHeight = canvas.getHeight();
        let dx = 0,
          dy = 0;
        // Snap left/right
        if (rect.left < 0) {
          dx = -rect.left;
        } else if (rect.left + rect.width > canvasWidth) {
          dx = canvasWidth - (rect.left + rect.width);
        }
        // Snap top/bottom
        if (rect.top < 0) {
          dy = -rect.top;
        } else if (rect.top + rect.height > canvasHeight) {
          dy = canvasHeight - (rect.top + rect.height);
        }
        if (dx !== 0 || dy !== 0) {
          // Move by offset, using current origin
          const originX = selectedObject.originX || 'center';
          const originY = selectedObject.originY || 'center';
          // Calculate new center position
          const newCenter = new fabric.Point(
            (selectedObject.left ?? 0) + dx,
            (selectedObject.top ?? 0) + dy
          );
          selectedObject.setPositionByOrigin(newCenter, originX, originY);
          selectedObject.setCoords();
        }
      }

      shouldRender = true;
      Object.assign(effectiveUpdates, updatedProperties);
    });

    if (shouldRender) canvas.renderAll();

    setProperties((prev) => ({
      ...prev,
      ...effectiveUpdates,
    }));

    // Detect Row Label updates for Store Sync
    // This is crucial because useRowLabelRenderer relies on Store State (row.fontSize)
    // If we only update the visual object, the renderer will reset it to default on next sync.
    if ('fontSize' in updates && typeof updates.fontSize === 'number') {
      activeObjects.forEach((obj) => {
        if (obj.isRowLabel && obj.rowId) {
          updateRow(obj.rowId, { fontSize: updates.fontSize });
        }
      });
    }
  };

  return { updateObject };
};
