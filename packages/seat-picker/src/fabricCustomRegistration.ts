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
        number: this.attributes?.number ?? this.seatNumber ?? '',
        rowLabel: this.attributes?.rowLabel ?? this.rowLabel ?? '',
        price: this.attributes?.price ?? this.price ?? '',
        category: this.attributes?.category ?? this.category ?? '',
        status: this.attributes?.status ?? this.status ?? '',
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
  if (options && options.attributes) {
    this.attributes = { ...options.attributes };
    this.seatNumber = options.attributes.number;
    this.rowLabel = options.attributes.rowLabel;
    this.price = options.attributes.price;
    this.category = options.attributes.category;
    this.status = options.attributes.status;
  }
  return this;
};
