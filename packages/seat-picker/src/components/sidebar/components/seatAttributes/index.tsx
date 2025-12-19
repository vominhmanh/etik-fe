import React, { useState, useEffect, useMemo } from 'react';
import { Properties } from '../../hooks';
import { useEventGuiStore } from '@/zustand';
import CurrencySelect from './CurrencySelect';

interface SeatAttributesProps {
  properties: Properties;
  updateObject: (updates: Partial<Properties>) => void;
  Select: React.FC<{
    options: { value: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
  }>;
  selectedObjects?: any[];
}

const statusOptions = [
  { value: 'available', label: 'Available' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'sold', label: 'Sold' },
];

const categoryOptions = [
  { value: 'standard', label: 'Standard' },
  { value: 'vip', label: 'VIP' },
  { value: 'premium', label: 'Premium' },
];

const SeatAttributes: React.FC<SeatAttributesProps> = ({
  properties,
  updateObject,
  Select,
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
          options={categoryOptions}
          value={
            properties.category === 'mixed'
              ? ''
              : properties.category || 'standard'
          }
          onChange={(value) => updateObject({ category: value })}
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Price
        </label>
        <input
          type="number"
          value={properties.price === 'mixed' ? '' : properties.price || 0}
          placeholder={properties.price === 'mixed' ? '—' : ''}
          onChange={(e) => updateObject({ price: Number(e.target.value) })}
          className="mt-1 w-full rounded-md border border-solid border-gray-300 px-2 py-1"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Status
        </label>
        <Select
          options={statusOptions}
          value={
            properties.status === 'mixed'
              ? ''
              : properties.status || 'available'
          }
          onChange={(value) =>
            updateObject({ status: value as Properties['status'] })
          }
        />
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
