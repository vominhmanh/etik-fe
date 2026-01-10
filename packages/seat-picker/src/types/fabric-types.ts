import { Object as FabricObject, IObjectOptions } from 'fabric/fabric-impl';

export interface CustomFabricObject extends FabricObject {
  id?: string;
  rowId?: string;
  seatNumber?: string;
  isRowLabel?: boolean;
  radius?: number;
  fontSize?: number;
  fontWeight?: string;
  fontFamily?: string;
  text?: string;
}

export type UpdateableProperties = Partial<IObjectOptions> & {
  radius?: number;
  fontSize?: number;
  text?: string;
};
