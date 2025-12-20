import { useState, useEffect } from 'react';
import { fabric } from 'fabric';
import { Pattern, Gradient } from 'fabric/fabric-impl';
import { CustomFabricObject } from '@/types/fabric-types';

export interface Properties {
  angle: number;
  radius: number | 'mixed';
  width: number;
  height: number;
  fill: string | Pattern | Gradient | undefined;
  stroke: string | Pattern | Gradient | undefined;
  text: string;
  fontSize: number;
  fontWeight: string;
  fontFamily: string;
  left: number;
  top: number;
  rx?: number;
  ry?: number;
  rowId?: string | 'mixed';
  seatNumber?: string | 'mixed';
  category?: string | 'mixed';
  price?: number | 'mixed';
  status?: 'available' | 'reserved' | 'sold' | 'mixed';
  currencySymbol?: string | 'mixed';
  currencyCode?: string | 'mixed';
  currencyCountry?: string | 'mixed';
}

export const useObjectProperties = (
  canvas: fabric.Canvas | null,
  selectedObjects: CustomFabricObject[]
) => {
  // ::::::::::::::::::: Properties state
  const [properties, setProperties] = useState<Properties>({
    angle: 0,
    radius: 10,
    width: 100,
    height: 100,
    fill: 'transparent' as string | undefined,
    stroke: '#000000' as string | undefined,
    text: '',
    fontSize: 20,
    fontWeight: 'normal',
    fontFamily: 'sans-serif',
    left: 0,
    top: 0,
  });

  function getMergedValue<T>(objs: any[], key: string) {
    if (objs.length === 0) return '';
    const first = objs[0][key];
    return objs.every((obj) => obj[key] === first) ? first : 'mixed';
  }

  useEffect(() => {
    if (!selectedObjects || selectedObjects.length === 0) return;

    // Map seat groups to effective objects containing visual props from inner circle
    // Map seat groups to effective objects containing visual props from inner circle and text
    const objs = selectedObjects.map((obj) => {
      if (obj.type === 'group' && (obj.rowId || obj.seatNumber)) {
        const group = obj as fabric.Group;
        const circle = group.getObjects().find(o => o.type === 'circle');
        const text = group.getObjects().find(o => o.type === 'text' || o.type === 'i-text');

        let effectiveObj = { ...obj };

        if (circle) {
          effectiveObj = {
            ...effectiveObj,
            fill: circle.fill,
            stroke: circle.stroke,
            radius: (circle as any).radius
          };
        }

        if (text) {
          effectiveObj = {
            ...effectiveObj,
            text: (text as any).text,
            fontSize: (text as any).fontSize,
            fontWeight: (text as any).fontWeight,
            fontFamily: (text as any).fontFamily
          };
        }
        return effectiveObj;
      }
      return obj;
    });

    const activeObject = canvas?.getActiveObject();
    const isActiveSelection = activeObject?.type === 'activeSelection';

    setProperties({
      angle: isActiveSelection ? (activeObject?.angle ?? 0) : getMergedValue(objs, 'angle'),
      radius: getMergedValue(objs, 'radius'),
      width: isActiveSelection
        ? (activeObject?.getScaledWidth() ?? 0)
        : getMergedValue(objs, 'width') * (getMergedValue(objs, 'scaleX') || 1),
      height: isActiveSelection
        ? (activeObject?.getScaledHeight() ?? 0)
        : getMergedValue(objs, 'height') * (getMergedValue(objs, 'scaleY') || 1),
      fill: getMergedValue(objs, 'fill'),
      stroke: getMergedValue(objs, 'stroke'),
      text: getMergedValue(objs, 'text'),
      fontSize: getMergedValue(objs, 'fontSize'),
      fontWeight: getMergedValue(objs, 'fontWeight'),
      fontFamily: getMergedValue(objs, 'fontFamily'),
      left: isActiveSelection ? (activeObject?.left ?? 0) : getMergedValue(objs, 'left'),
      top: isActiveSelection ? (activeObject?.top ?? 0) : getMergedValue(objs, 'top'),
      rx: getMergedValue(objs, 'rx'),
      ry: getMergedValue(objs, 'ry'),
      rowId: getMergedValue(objs, 'rowId'),
      seatNumber: getMergedValue(objs, 'seatNumber'),
      category: getMergedValue(objs, 'category'),
      price: getMergedValue(objs, 'price'),
      status: getMergedValue(objs, 'status'),
      currencySymbol: getMergedValue(objs, 'currencySymbol'),
      currencyCode: getMergedValue(objs, 'currencyCode'),
      currencyCountry: getMergedValue(objs, 'currencyCountry'),
    });
  }, [selectedObjects]);

  return { properties, setProperties };
};
