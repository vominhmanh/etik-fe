import React, { useState, useEffect, useMemo } from 'react';
import { LuGrid2X2 } from 'react-icons/lu';
import { fabric } from 'fabric';
import { CustomFabricObject } from '@/types/fabric-types';

interface GridSpacingProps {
  canvas: fabric.Canvas | null;
  selectedObjects: CustomFabricObject[];
}

const GridSpacing: React.FC<GridSpacingProps> = ({
  canvas,
  selectedObjects,
}) => {
  const [rowSpacing, setRowSpacing] = useState<number | ''>('');
  const [colSpacing, setColSpacing] = useState<number | ''>('');

  // Group selection into stable visual rows based on Y-position
  const visualRows = useMemo(() => {
    if (selectedObjects.length === 0) return [];

    // Sort by Top primarily
    const sorted = [...selectedObjects].sort((a, b) => (a.top || 0) - (b.top || 0));

    const rows: CustomFabricObject[][] = [];
    let currentRow: CustomFabricObject[] = [];
    let currentRowTop = sorted[0].top || 0;

    sorted.forEach(obj => {
      // Tolerance of 10px to consider items in same row
      if (Math.abs((obj.top || 0) - currentRowTop) < 10) {
        currentRow.push(obj);
      } else {
        // New row
        rows.push(currentRow);
        currentRow = [obj];
        currentRowTop = obj.top || 0;
      }
    });
    if (currentRow.length > 0) rows.push(currentRow);

    // Sort items within each row by Left to establish columns
    rows.forEach(row => row.sort((a, b) => (a.left || 0) - (b.left || 0)));

    return rows;
  }, [selectedObjects]); // Re-calculate grouping only if selection composition changes

  // Detect current spacing consistency
  useEffect(() => {
    if (visualRows.length === 0) return;

    // --- Detect Column Spacing ---
    let consistentColSpacing: number | null = null;
    let isColMixed = false;
    let hasColGap = false;

    for (const row of visualRows) {
      if (row.length < 2) continue; // Single item row has no internal spacing
      hasColGap = true;
      for (let i = 1; i < row.length; i++) {
        const gap = (row[i].left || 0) - (row[i - 1].left || 0);
        if (consistentColSpacing === null) {
          consistentColSpacing = gap;
        } else if (Math.abs(gap - consistentColSpacing) > 1) { // 1px tolerance
          isColMixed = true;
          break;
        }
      }
      if (isColMixed) break;
    }

    setColSpacing(isColMixed || !hasColGap || consistentColSpacing === null ? '' : Math.round(consistentColSpacing));

    // --- Detect Row Spacing ---
    let consistentRowSpacing: number | null = null;
    let isRowMixed = false;

    if (visualRows.length > 1) {
      for (let i = 1; i < visualRows.length; i++) {
        // Calculate pitch between Row i and Row i-1 (using first item as anchor)
        const rowTop = visualRows[i][0].top || 0;
        const prevRowTop = visualRows[i - 1][0].top || 0;
        const gap = rowTop - prevRowTop;

        if (consistentRowSpacing === null) {
          consistentRowSpacing = gap;
        } else if (Math.abs(gap - consistentRowSpacing) > 1) {
          isRowMixed = true;
          break;
        }
      }
    }

    setRowSpacing(isRowMixed || visualRows.length <= 1 || consistentRowSpacing === null ? '' : Math.round(consistentRowSpacing));

  }, [visualRows]);


  const handleSpacingChange = (type: 'row' | 'column', val: number) => {
    if (!canvas) return;
    const minSpacing = 1;
    const maxSpacing = 500;
    const safeVal = Math.max(minSpacing, Math.min(maxSpacing, val));

    if (type === 'column') {
      // Adjust X position within each row, preserving the row structure
      const allObjects = canvas.getObjects() as CustomFabricObject[];
      visualRows.forEach(row => {
        if (row.length < 2) return;
        const startLeft = row[0].left || 0;
        const rowId = row[0].rowId;

        // Calculate shift for the last item to update right label
        const lastIdx = row.length - 1;
        const oldLeftLast = row[lastIdx].left || 0;
        const newLeftLast = startLeft + lastIdx * safeVal;
        const deltaLast = newLeftLast - oldLeftLast;

        row.forEach((obj, idx) => {
          // obj 0 stays at startLeft. obj 1 moves to startLeft + val, etc.
          const newLeft = startLeft + idx * safeVal;
          obj.set({ left: newLeft });
          obj.setCoords();
        });

        // Sync Right Label (Left label stays since startLeft is fixed)
        if (rowId) {
          const rightLabel = allObjects.find(o => o.isRowLabel && o.rowId === rowId && o.originX === 'left');
          if (rightLabel) {
            rightLabel.set({ left: (rightLabel.left || 0) + deltaLast });
            rightLabel.setCoords();
          }
        }
      });
      setColSpacing(safeVal);
    } else {
      // Adjust Y position of entire rows
      if (visualRows.length < 2) return;
      const startTop = visualRows[0][0].top || 0;
      const allObjects = canvas.getObjects() as CustomFabricObject[];

      visualRows.forEach((row, rowIndex) => {
        // Row 0 stays attached to startTop.
        // Row i moves to startTop + i * spacing
        const targetRowTop = startTop + rowIndex * safeVal;
        const currentRowTop = row[0].top || 0;
        const shift = targetRowTop - currentRowTop;
        const rowId = row[0].rowId;

        row.forEach(obj => {
          obj.set({ top: (obj.top || 0) + shift });
          obj.setCoords();
        });

        // Sync Labels (Vertical Shift)
        if (rowId) {
          const labels = allObjects.filter(o => o.isRowLabel && o.rowId === rowId);
          labels.forEach(l => {
            l.set({ top: (l.top || 0) + shift });
            l.setCoords();
          });
        }
      });
      setRowSpacing(safeVal);
    }
    canvas.renderAll();
  };

  if (selectedObjects.length <= 1) return null;

  return (
    <>
      <div className="mb-2 text-xs font-semibold text-gray-500">
        Editing {selectedObjects.length} seats ({visualRows.length} Rows)
      </div>
      <div className="rounded-md bg-white p-4 shadow">
        <div className="mb-4 flex items-center gap-2">
          <LuGrid2X2 className="h-5 w-5 text-gray-500" />
          <h3 className="font-semibold">Grid Spacing</h3>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-gray-600">
                Row Spacing
              </label>
              <div className="mt-1 flex items-center gap-1">
                <button
                  className="flex h-6 w-6 items-center justify-center rounded border border-solid border-gray-200 text-xs transition-colors hover:bg-gray-100 disabled:opacity-50"
                  onClick={() =>
                    handleSpacingChange('row', (typeof rowSpacing === 'number' ? rowSpacing : 20) - 1)
                  }
                  disabled={visualRows.length <= 1}
                  title="Decrease row spacing"
                >
                  -
                </button>
                <input
                  type="number"
                  value={rowSpacing}
                  placeholder={visualRows.length <= 1 ? "—" : "Mixed"}
                  disabled={visualRows.length <= 1}
                  onChange={(e) =>
                    handleSpacingChange('row', Number(e.target.value))
                  }
                  className="w-12 rounded border border-solid border-gray-200 bg-white px-1 py-0.5 text-center text-xs [appearance:textfield] focus:outline-none focus:ring-1 focus:ring-gray-500 disabled:bg-gray-100 disabled:text-gray-400 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  min="1"
                  max="500"
                  step="1"
                />
                <button
                  className="flex h-6 w-6 items-center justify-center rounded border border-solid border-gray-200 text-xs transition-colors hover:bg-gray-100 disabled:opacity-50"
                  onClick={() =>
                    handleSpacingChange('row', (typeof rowSpacing === 'number' ? rowSpacing : 20) + 1)
                  }
                  disabled={visualRows.length <= 1}
                  title="Increase row spacing"
                >
                  +
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-600">
                Col Spacing
              </label>
              <div className="mt-1 flex items-center gap-1">
                <button
                  className="flex h-6 w-6 items-center justify-center rounded border border-solid border-gray-200 text-xs transition-colors hover:bg-gray-100 disabled:opacity-50"
                  onClick={() =>
                    handleSpacingChange('column', (typeof colSpacing === 'number' ? colSpacing : 20) - 1)
                  }
                  title="Decrease column spacing"
                >
                  -
                </button>
                <input
                  type="number"
                  value={colSpacing}
                  placeholder="Mixed"
                  onChange={(e) =>
                    handleSpacingChange('column', Number(e.target.value))
                  }
                  className="w-12 rounded border border-solid border-gray-200 bg-white px-1 py-0.5 text-center text-xs [appearance:textfield] focus:outline-none focus:ring-1 focus:ring-gray-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  min="1"
                  max="500"
                  step="1"
                />
                <button
                  className="flex h-6 w-6 items-center justify-center rounded border border-solid border-gray-200 text-xs transition-colors hover:bg-gray-100 disabled:opacity-50"
                  onClick={() =>
                    handleSpacingChange('column', (typeof colSpacing === 'number' ? colSpacing : 20) + 1)
                  }
                  title="Increase column spacing"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GridSpacing;
