import { Pattern, Gradient } from 'fabric/fabric-impl';

// :::::::::::::::::::: Converts number to float conditionally
export const toFloat = (num: any) => {
  if (typeof num !== 'number' || isNaN(num)) return '';
  return num % 1 !== 0 ? Number(num.toFixed(2)) : num;
};

// ::::::::::::::::::: Object Properties type
export interface PropertiesType {
  angle?: number;
  radius?: number;
  width?: number;
  height?: number;
  fill?: string | Pattern | Gradient | undefined;
  stroke?: string | Pattern | Gradient | undefined;
  text?: string;
  fontSize?: number;
  fontWeight?: string;
  fontFamily?: string;
  left?: number;
  top?: number;
}

export const formatPrice = (price: string | number) => {
  if (price === 'mixed') return '—';
  if (!price && price !== 0) return '';
  const num = Number(price);
  if (isNaN(num)) return '';
  return num.toLocaleString('vi-VN').replace(/,/g, '.') + ' đ';
};

export function getExcelAlpha(n: number) {
  let ordA = 'A'.charCodeAt(0);
  let ordZ = 'Z'.charCodeAt(0);
  let len = ordZ - ordA + 1;
  let s = '';
  while (n >= 0) {
    s = String.fromCharCode((n % len) + ordA) + s;
    n = Math.floor(n / len) - 1;
  }
  return s;
}

export function getAlphaIndex(s: string) {
  if (!/^[A-Z]+$/i.test(s)) return -1;
  const upper = s.toUpperCase();
  let n = 0;
  for (let i = 0; i < upper.length; i++) {
    n = n * 26 + (upper.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
  }
  return n - 1;
}
