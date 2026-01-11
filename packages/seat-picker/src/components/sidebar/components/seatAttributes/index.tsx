import React, { useState, useEffect, useMemo } from 'react';
import { Properties, useObjectProperties } from '@/hooks/useObjectProperties';
import { toFloat, formatPrice } from '@/utils';
import { useEventGuiStore } from '@/zustand';
import { CategoryInfo } from '@/types/data.types';
import { useObjectUpdater } from '@/hooks/useObjectUpdater';
import { CustomFabricObject } from '@/types/fabric-types';
import Select from '@/components/ui/select';

interface SeatAttributesProps {
  selectedObjects: CustomFabricObject[];
  categories?: CategoryInfo[];
}

const statusOptions = [
  { value: 'available', label: 'Available' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'held', label: 'Held' },
  { value: 'sold', label: 'Sold' },
];

const selectableStatusOptions = [
  { value: 'available', label: 'Available' },
  { value: 'blocked', label: 'Blocked' },
];

const SeatAttributes: React.FC<SeatAttributesProps> = ({
  selectedObjects,
  categories = [],
}) => {
  const { canvas, rows } = useEventGuiStore();
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const { properties, setProperties } = useObjectProperties(
    canvas,
    selectedObjects
  );
  const [lockAspect, setLockAspect] = useState(true);
  const { updateObject } = useObjectUpdater(canvas, setProperties, lockAspect);

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
          disabled={properties.status === 'sold' || properties.status === 'held'}
          className={`mt-1 w-full rounded-md border border-solid px-2 py-1 ${isDuplicate && !isFocused
            ? 'border-orange-500 focus:ring-orange-500'
            : 'border-gray-300'
            } ${properties.status === 'sold' || properties.status === 'held' ? 'cursor-not-allowed bg-gray-100 text-gray-500' : ''}`}
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
            value: String(cat.id),
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
              : String(properties.category || '')
          }
          onChange={(value) => {
            const numericValue = parseInt(value, 10);
            const selectedCategory = categories.find(c => c.id === numericValue);
            const updates: any = { category: numericValue };
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
          disabled={properties.status === 'sold' || properties.status === 'held'}
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
          options={
            ['sold', 'held'].includes(properties.status as string)
              ? statusOptions
              : selectableStatusOptions
          }
          value={
            properties.status === 'mixed'
              ? ''
              : properties.status || 'available'
          }
          onChange={(value) => {
            const newStatus = value as Properties['status'];
            const updates: Partial<Properties> = { status: newStatus };
            // Do NOT send fill here. updateSeatVisuals will use the existing fill of each seat to calculate darken color.
            updateObject(updates);
          }}
          disabled={properties.status === 'sold' || properties.status === 'held'}
        />
        {(properties.status === 'sold' || properties.status === 'held') && (
          <div className="mt-1 text-xs text-gray-500 italic">
            You can not change the configuration of this seat.
          </div>
        )}
      </div>
    </div>
  );
};

export default SeatAttributes;
