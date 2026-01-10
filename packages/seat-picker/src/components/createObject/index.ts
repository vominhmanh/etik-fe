import { fabric } from 'fabric';
import { v4 as uuidv4 } from 'uuid';

// ::::::::::::::: Create rectangle object
const createRect = (left: number, top: number) => {
  const rect = new fabric.Rect({
    left,
    top,
    fill: '#cccccc',
    stroke: 'black',
    strokeWidth: 1,
    width: 100,
    height: 100,
    selectable: true,
    borderColor: 'green',
    borderDashArray: [2, 4],
    padding: 2,
    cornerColor: 'lightblue',
    cornerSize: 5,
    cornerStrokeColor: 'blue',
    transparentCorners: false,
    id: uuidv4(),
    strokeUniform: true,
    rx: 0,
    ry: 0,
  } as any);

  rect.setControlsVisibility({
    mt: false,
    mb: false,
    ml: false,
    mr: false,
  });

  return rect;
};

// ::::::::::::::: Create seat object
const createSeat = (
  left: number,
  top: number,
  rowId: string,
  seatNumber: string,
  canvas?: fabric.Canvas | null,
  options: { radius?: number; fontSize?: number } = {}
) => {
  const circle = new fabric.Circle({
    radius: options.radius ?? 10,
    fill: 'rgba(255,255,255,0.8)',
    stroke: 'black',
    strokeWidth: 1,
    originX: 'center',
    originY: 'center',
  });

  const text = new fabric.Text(seatNumber || '', {
    fontSize: options.fontSize ?? 10,
    fontFamily: 'sans-serif',
    fill: 'black',
    originX: 'center',
    originY: 'center',
  });

  const group = new fabric.Group([circle, text], {
    left,
    top,
    selectable: true,
    padding: 2,
    cornerSize: 5,
    transparentCorners: false,
    borderColor: 'green',
    cornerColor: 'lightblue',
    cornerStrokeColor: 'blue',
    borderDashArray: [2, 4],
    id: uuidv4(),
    rowId: rowId,
    seatNumber: seatNumber,
    customType: 'seat', // Explicitly define as seat
  } as any);

  group.setControlsVisibility({
    mt: false,
    mb: false,
    ml: false,
    mr: false,
  });

  return group;
};

// ::::::::::::::: Create text object
const createText = (left: number, top: number, text: string = 'Type here') => {
  const textObject = new fabric.IText(text, {
    left,
    top,
    fontSize: 20,
    fill: 'black',
    selectable: true,
    borderColor: 'green',
    borderDashArray: [2, 4],
    padding: 2,
    cornerColor: 'lightblue',
    cornerSize: 5,
    cornerStrokeColor: 'blue',
    transparentCorners: false,
    fontFamily: 'sans-serif',
    id: uuidv4(),
    strokeUniform: true,
  } as any);

  textObject.setControlsVisibility({
    mt: false,
    mb: false,
    ml: false,
    mr: false,
  });

  return textObject;
};


export {
  createRect,
  createSeat,
  createText,
};
