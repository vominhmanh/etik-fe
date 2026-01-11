
import { fabric } from 'fabric';

export const SEAT_STYLE_CONFIG = {
  empty: {
    fill: 'rgba(209, 193, 193, 0.7)',
    stroke: 'black',
    strokeWidth: 0,
  },
  icons: {
    blocked: 'M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10z',
    held: 'M6 2v6h.01L6 8.01 10 12l-4 4 .01.01H6V22h12v-5.99h-.01L18 16l-4-4 4-3.99-.01-.01H18V2H6z',
    sold: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
  },
  iconStyle: {
    fill: '#ffffff',
    scaleRatio: 0.5,
    opacity: 0.9,
    shadowBlur: 2,
    shadowColor: 'rgba(0,0,0,0.5)',
  }
};

export function applyCustomStyles(obj: fabric.Object) {
  obj.set({
    borderColor: 'green',
    borderDashArray: [2, 4],
    padding: 2,
    cornerColor: 'lightblue',
    cornerSize: 5,
    cornerStrokeColor: 'blue',
    transparentCorners: false,
    strokeUniform: true,
  });
  obj.setControlsVisibility &&
    obj.setControlsVisibility({
      mt: false, mb: false, ml: false, mr: false,
    });
}

export function applyEmptySeatStyle(obj: fabric.Object) {
  const { fill, stroke, strokeWidth } = SEAT_STYLE_CONFIG.empty;
  const style = { fill, stroke, strokeWidth };

  if (obj.type === 'group') {
    const group = obj as fabric.Group;
    const objectsToRemove: fabric.Object[] = [];

    group.getObjects().forEach((subObj: any) => {
      if (subObj.type === 'circle') {
        subObj.set(style);
      } else if (subObj.type === 'text' || subObj.type === 'i-text') {
        subObj.set('fill', 'black');
      } else {
        objectsToRemove.push(subObj);
      }
    });
    objectsToRemove.forEach((o) => group.remove(o));
  } else {
    obj.set(style);
  }
}

export function getDarkenColor(baseColor: string): string {
  if (!baseColor || baseColor === 'transparent') return '#808080';
  const c = new fabric.Color(baseColor);
  const s = c.getSource();
  // 50% darken
  return `rgb(${Math.max(0, s[0] >> 1)},${Math.max(0, s[1] >> 1)},${Math.max(0, s[2] >> 1)})`;
}

export function applyDarkenStyle(obj: fabric.Object, baseColor: string) {
  const darkenColor = getDarkenColor(baseColor);
  if (obj.type === 'group') {
    (obj as fabric.Group).getObjects().forEach((subObj: any) => {
      if (subObj.type === 'circle') subObj.set('fill', darkenColor);
    });
    (obj as fabric.Group).addWithUpdate();
  } else {
    obj.set('fill', darkenColor);
  }
}

export interface SeatVisualUpdates {
  fill?: string | fabric.Pattern | fabric.Gradient;
  stroke?: string | fabric.Pattern | fabric.Gradient;
  radius?: number;
  fontSize?: number;
  status?: string;
  seatNumber?: string | number;
}

export function updateSeatVisuals(group: fabric.Group, updates: SeatVisualUpdates) {
  const objects = group.getObjects();
  const circle = objects.find(o => o.type === 'circle') as fabric.Circle;
  const textObj = objects.find(o => o.type === 'text' || o.type === 'i-text') as fabric.Text;

  if (!circle) return; // Should not happen for a valid seat group

  // 1. Batch Geometry Updates
  if (updates.radius !== undefined && typeof updates.radius === 'number') {
    const scale = group.scaleX || 1;
    const r = updates.radius / scale;
    circle.set({ radius: r, width: r * 2, height: r * 2 });
  }

  // 2. Text Updates
  if (textObj) {
    const textUpdates: any = {};
    if (updates.fontSize !== undefined) textUpdates.fontSize = updates.fontSize;
    if (updates.seatNumber !== undefined) textUpdates.text = String(updates.seatNumber);
    if (Object.keys(textUpdates).length > 0) textObj.set(textUpdates);
  }

  // 3. Style Updates (Fill/Stroke)
  const circleUpdates: any = {};
  if (updates.stroke !== undefined) circleUpdates.stroke = String(updates.stroke);

  // Handle Fill & Status logic
  const currentStatus = updates.status || (group as any).status || 'available';
  const baseFill = updates.fill ?? circle.fill; // Use new fill or existing

  const isUnavailable = ['blocked', 'sold', 'held'].includes(currentStatus);

  if (isUnavailable) {
    // Always darken unavailable seats, even if base is transparent
    circleUpdates.fill = getDarkenColor(baseFill as string);
  } else if (baseFill && baseFill !== 'transparent') {
    // Apply base fill for available seats
    circleUpdates.fill = baseFill;
  }

  if (Object.keys(circleUpdates).length > 0) {
    circle.set(circleUpdates);
  }

  // 4. Icon Management
  // Only update icons if status changed or explicit request (checked via updates presence)
  if (updates.status !== undefined || updates.fill !== undefined) {
    // Remove old icons
    const iconsToRemove = objects.filter((o: any) => o.name === 'status_icon');
    iconsToRemove.forEach(icon => group.remove(icon));

    // Add new icon
    const iconPathData = SEAT_STYLE_CONFIG.icons[currentStatus as keyof typeof SEAT_STYLE_CONFIG.icons];
    if (iconPathData) {
      const { fill, opacity, shadowBlur, shadowColor } = SEAT_STYLE_CONFIG.iconStyle;

      const path = new fabric.Path(iconPathData, {
        fill, opacity,
        originX: 'center', originY: 'center',
        name: 'status_icon',
        shadow: new fabric.Shadow({ color: shadowColor, blur: shadowBlur })
      });

      // Fit icon to circle
      const radius = circle.radius || 10;
      const iconSize = Math.max(path.width || 0, path.height || 0);
      if (iconSize > 0) {
        const scale = (radius * 1.2) / iconSize; // 1.2x radius usually covers well
        path.set({ scaleX: scale, scaleY: scale });
      }
      path.set({ left: circle.left, top: circle.top });
      group.add(path);
    }
  }

  group.addWithUpdate();
}
