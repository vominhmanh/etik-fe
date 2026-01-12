// src/types/data.types.ts

import { Row } from "@/zustand/store/eventGuiStore";


export interface CategoryInfo {
  id: number;
  name: string;
  color: string;
  price: number;
}

export type SeatStatus = 'available' | 'held' | 'sold' | 'blocked';

export interface CanvasObject {
  version: string;
  background?: string;
  objects: ObjectProperties[];
}

// Base type for all canvas objects
export interface Layout {
  type: string;
  categories?: CategoryInfo[];
  rows: Row[];
  canvas: CanvasObject;
}

// Types for different object properties
export interface ObjectProperties {
  id: string;
  type: 'circle' | 'rect' | 'i-text' | 'path' | 'group';
  left: number;
  top: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  angle: number;
  fill: string | null;
  stroke: string | null;
  strokeWidth: number;
  opacity: number;
  selectable: boolean;
  evented: boolean;
  hasControls: boolean;
  hasBorders: boolean;
  lockMovementX: boolean;
  lockMovementY: boolean;
  lockRotation: boolean;
  lockScalingX: boolean;
  lockScalingY: boolean;
  lockUniScaling: boolean;
  objects?: ObjectProperties[];
  customType?: 'seat' | 'zone' | 'text';
}

export interface CategoryStats {
  id: number;
  total: number;
  booked: number;
  pending: number;
  locked: number;
}

// Circle specific properties (for seats)
export interface SeatObject extends ObjectProperties {
  type: 'circle';
  radius: number;
  startAngle: number;
  endAngle: number;
  customType: 'seat';
  seatData: {
    id: string;
    number: string;
    rowId: string;
    categoryId: number | null;
    seatNumber: string | null;
    status: SeatStatus;
    price?: number;
  };
}

// Rectangle specific properties (for zones)
export interface RectangleObject extends ObjectProperties {
  type: 'rect';
  rx: number;
  ry: number;
  customType: 'zone';
  zoneData?: {
    id: string;
    name: string;
    category?: string;
    price?: number;
  };
}

// Text specific properties
export interface TextObject extends ObjectProperties {
  type: 'i-text';
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: string | number;
  customType: 'text';
}

// Union type for all possible object types
export type CanvasObjectData = SeatObject | RectangleObject | TextObject;

// Type for the onChange and onSave callbacks
export type CanvasJsonCallback = (json: Layout) => void;

// Props type for SeatCanvas component
export interface SeatCanvasProps {
  className?: string;
  onChange?: CanvasJsonCallback;
  onSave: (json: Layout) => void;
  layout: Layout;
  readOnly?: boolean;
  style?: {
    width?: number;
    height?: number;
    backgroundColor?: string;
    showSeatNumbers?: boolean;
    seatNumberStyle?: {
      fontSize?: number;
      fill?: string;
      fontWeight?: string;
      fontFamily?: string;
    };
    seatStyle?: {
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
      radius?: number;
    };
  };
  renderToolbar?: (props: {
    onSave?: (json: Layout) => void;
    onBgLayout?: () => void;
    categories?: CategoryInfo[];
    onSaveCategories?: (categories: CategoryInfo[]) => void;
  }) => React.ReactNode;
  renderSidebar?: () => React.ReactNode;
  renderSeatDetails?: (props: {
    seat: SeatData;
    onClose: () => void;
    onAction: (action: string) => void;
  }) => React.ReactNode;
  onSeatClick?: (seat: SeatData) => void;
  onSeatAction?: (action: string, seat: SeatData) => void;
  labels?: {
    buyButton?: string;
    cancelButton?: string;
    seatNumber?: string;
    category?: string;
    price?: string;
    status?: string;
  };
  categories?: CategoryInfo[];
  onSaveCategories?: (categories: CategoryInfo[]) => void;
  existingSeats: ShowSeat[];
  createCategoryUrl?: string;
  onUploadBackground?: (file: File) => Promise<string | null>;
  renderOverlay?: (props: { isFullScreen: boolean }) => React.ReactNode;
  selectedSeatIds?: string[];
  onSelectionChange?: (selectedIds: string[], selectedSeats: SeatData[]) => void;
  onBack?: () => void;
}

export interface SeatData {
  // UUID of seat in layout_json (fabric object id / canvasSeatId)
  id: string;
  number: string;
  rowLabel: string;
  price: number;
  category: number;
  status: string;
  categoryInfo: CategoryInfo;
}

export interface ZoneData {
  name?: string;
  description?: string;
  id: string;
  number: string;
  rowLabel: string;
  price: number;
  category: number;
  status: string;
  categoryInfo: CategoryInfo;
}

export interface ShowSeat {
  id: number;
  canvasSeatId: string;
  salable: boolean;
  note: string;
  rowLabel: string | null;
  seatNumber: string | null;
  ticketCategoryId: number | null;
  status: SeatStatus;
}
