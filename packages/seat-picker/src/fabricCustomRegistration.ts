import { fabric } from 'fabric';

declare module 'fabric/fabric-impl' {
  interface Circle {
    attributes?: {
      number?: string | number;
      rowLabel?: string;
      price?: string | number;
      category?: string;
      status?: string;

    };
    seatNumber?: string | number;
    rowLabel?: string;
    price?: string | number;
    category?: string;
    status?: string;

  }
}

// Extend Circle (seat) to include attributes object
fabric.Circle.prototype.toObject = (function (toObject) {
  return function (this: fabric.Circle, propertiesToInclude = []) {
    return {
      ...toObject.call(this, propertiesToInclude),
      attributes: {
        number: this.seatNumber ?? '',
        rowLabel: this.rowLabel ?? '',
        price: this.price ?? 0,
        category: this.category ?? 0,
        status: this.status ?? '',
      },
    };
  };
})(fabric.Circle.prototype.toObject);

// Restore attributes on fromObject/initialize
const origInitialize = fabric.Circle.prototype.initialize;
fabric.Circle.prototype.initialize = function (
  this: fabric.Circle,
  options: any
) {
  origInitialize.call(this, options);
  if (options) {
    this.seatNumber = options.number;
    this.rowLabel = options.rowLabel;
    this.price = options.price;
    this.category = options.category;
    this.status = options.status;
  }
  return this;
};
