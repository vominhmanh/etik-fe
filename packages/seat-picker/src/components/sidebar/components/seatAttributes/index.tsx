import React, { useState, useEffect, useMemo } from 'react';
import { Properties } from '../../hooks';
import { toFloat, formatPrice } from '@/utils';
import { fabric } from 'fabric';
import { useEventGuiStore } from '@/zustand';
import CurrencySelect from './CurrencySelect';
import { TicketCategory } from '@/types/data.types';

interface SeatAttributesProps {
  properties: Properties;
  updateObject: (updates: Partial<Properties>) => void;
  Select: React.FC<{
    options: { value: string; label: string | React.ReactNode }[];
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
  }>;
  selectedObjects?: any[];
  categories?: TicketCategory[];
}

const statusOptions = [
  { value: 'available', label: 'Available' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'sold', label: 'Sold' },
];

const selectableStatusOptions = [
  { value: 'available', label: 'Available' },
  { value: 'blocked', label: 'Blocked' },
];

const SeatAttributes: React.FC<SeatAttributesProps> = ({
  properties,
  updateObject,
  Select,
  categories = [],
}) => {
  const { canvas, rows } = useEventGuiStore();
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const currentRow = rows.find((r: any) => r.id === properties.rowId);
  const rowLabel = currentRow
    ? currentRow.name
    : properties.rowId === 'mixed'
      ? 'Mixed'
      : '';

  const rowIdDisplay =
    properties.rowId === 'mixed' ? 'Mixed' : properties.rowId || '';

  useEffect(() => {
    if (!isFocused) {
      setInputValue(
        properties.seatNumber === 'mixed' ? '' : properties.seatNumber || ''
      );
    }
  }, [properties.seatNumber, isFocused]);

  const isDuplicate = useMemo(() => {
    if (
      !canvas ||
      !inputValue ||
      properties.rowId === 'mixed' ||
      !properties.rowId
    )
      return false;
    const rowSeats = canvas
      .getObjects()
      .filter((obj: any) => obj.rowId === properties.rowId);

    return rowSeats.some(
      (obj: any) =>
        obj.seatNumber === inputValue && obj !== canvas.getActiveObject()
    );
  }, [canvas, inputValue, properties.rowId]);

  const handleSeatNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    updateObject({ seatNumber: val });
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Row Label
          </label>
          <input
            type="text"
            disabled
            value={rowLabel}
            className="mt-1 w-full rounded-md border border-solid border-gray-200 bg-gray-100 px-2 py-1 text-gray-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Row ID
          </label>
          <input
            type="text"
            disabled
            value={rowIdDisplay}
            className="mt-1 w-full truncate rounded-md border border-solid border-gray-200 bg-gray-100 px-2 py-1 text-gray-500"
            title={rowIdDisplay}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Seat Number
        </label>
        <input
          type="text"
          value={inputValue}
          placeholder={properties.seatNumber === 'mixed' ? '—' : ''}
          onChange={handleSeatNumberChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`mt-1 w-full rounded-md border border-solid px-2 py-1 ${isDuplicate && !isFocused
            ? 'border-orange-500 focus:ring-orange-500'
            : 'border-gray-300'
            }`}
        />
        {isDuplicate && !isFocused && (
          <div className="mt-1 text-xs text-orange-500">
            Trùng seat number
          </div>
        )}
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Category
        </label>
        <Select
          options={categories.map((cat) => ({
            value: cat.id.toString(),
            label: (
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                {cat.name}
              </div>
            ),
          }))}
          value={
            properties.category === 'mixed'
              ? ''
              : properties.category || ''
          }
          onChange={(value) => {
            const selectedCategory = categories.find(c => c.id.toString() === value);
            const updates: any = { category: value };
            if (selectedCategory) {
              if (selectedCategory.color) {
                updates.fill = selectedCategory.color;
              }
              if (selectedCategory.price !== undefined) {
                updates.price = selectedCategory.price;
              }
            }
            updateObject(updates);
          }}
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Price
        </label>
        <input
          type="text"
          disabled
          value={formatPrice(properties.price || 0)}
          placeholder={properties.price === 'mixed' ? '—' : ''}
          onChange={(e) => { }}
          className="mt-1 w-full rounded-md border border-solid border-gray-200 bg-gray-50 px-2 py-1 text-gray-500"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Status
        </label>
        <Select
          options={selectableStatusOptions}
          value={
            properties.status === 'mixed'
              ? ''
              : properties.status || 'available'
          }
          onChange={(value) => {
            const newStatus = value as Properties['status'];
            const updates: Partial<Properties> = { status: newStatus };

            // Find current category color to use as base
            // Use properties.category (ID) to find in categories list
            const currentCatId = properties.category;
            const category = categories.find(c => c.id.toString() === String(currentCatId));
            const baseColor = category?.color || properties.fill;

            if (baseColor && typeof baseColor === 'string') {
              if (newStatus === 'available') {
                // Restore base color
                updates.fill = baseColor;
              } else {
                // Darken inline
                const c = new fabric.Color(baseColor);
                const s = c.getSource();
                const r = Math.max(0, Math.floor(s[0] * 0.5));
                const g = Math.max(0, Math.floor(s[1] * 0.5));
                const b = Math.max(0, Math.floor(s[2] * 0.5));
                updates.fill = `rgb(${r},${g},${b})`;
              }
            }

            updateObject(updates);
          }}
          disabled={properties.status === 'sold' || properties.status === 'held'}
        />
        {(properties.status === 'sold' || properties.status === 'held') && (
          <div className="mt-1 text-xs text-gray-500 italic">
            Status is read-only: {properties.status}
          </div>
        )}
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Currency
        </label>
        <CurrencySelect
          value={properties.currencySymbol || ''}
          onChange={(symbol, code, country) =>
            updateObject({
              currencySymbol: symbol,
              currencyCode: code,
              currencyCountry: country,
            })
          }
        />
      </div>
    </div>
  );
};

export default SeatAttributes;
