import React, { useEffect, useState } from 'react';
import { fabric } from 'fabric';
import { v4 as uuidv4 } from 'uuid';
import { useEventGuiStore } from '@/zustand/store/eventGuiStore';
import { CustomFabricObject } from '@/types/fabric-types';
import { createSeat } from '../../createObject';

const RowProperties: React.FC = () => {
    const { selectedRowId, rows, updateRow, canvas } = useEventGuiStore();
    const [name, setName] = useState('');
    const [showLabelLeft, setShowLabelLeft] = useState(false);
    const [showLabelRight, setShowLabelRight] = useState(false);

    const currentRow = rows.find((r) => r.id === selectedRowId);

    useEffect(() => {
        if (currentRow) {
            setName(currentRow.name);
            setShowLabelLeft(currentRow.showLabelLeft || false);
            setShowLabelRight(currentRow.showLabelRight || false);
        }
    }, [currentRow, selectedRowId]);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        setName(newName);
        if (selectedRowId) {
            updateRow(selectedRowId, { name: newName });
        }
    };

    const handleLeftChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.checked;
        setShowLabelLeft(val);
        if (selectedRowId) updateRow(selectedRowId, { showLabelLeft: val });
    };

    const handleRightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.checked;
        setShowLabelRight(val);
        if (selectedRowId) updateRow(selectedRowId, { showLabelRight: val });
    };

    const handleAddSeat = () => {
        if (!canvas || !selectedRowId) return;

        // Ensure we work with absolute coordinates by breaking any active selection
        if (canvas.getActiveObject()?.type === 'activeSelection') {
            canvas.discardActiveObject();
            canvas.renderAll();
        }

        const allObjects = canvas.getObjects() as CustomFabricObject[];
        const rowSeats = allObjects.filter((o) => o.rowId === selectedRowId);

        let nextNum = 1;
        let left = 100;
        let top = 100;

        if (rowSeats.length > 0) {
            // Find max seat number
            const maxNum = rowSeats.reduce((max, curr) => {
                const num = parseInt(curr.seatNumber || '0') || 0;
                return num > max ? num : max;
            }, 0);
            nextNum = maxNum + 1;

            // Find the seat with the max number to position relative to it
            const lastSeat = rowSeats.find(
                (s) => (parseInt(s.seatNumber || '0') || 0) === maxNum
            );

            if (lastSeat) {
                left = (lastSeat.left || 0) + 25;
                top = lastSeat.top || 100;
            } else {
                // Fallback to visual right-most using absolute coordinates
                let rightMost = rowSeats[0];
                let maxLeft = -Infinity;

                rowSeats.forEach((seat) => {
                    if ((seat.left || 0) > maxLeft) {
                        maxLeft = seat.left || 0;
                        rightMost = seat;
                    }
                });

                left = (rightMost.left || 0) + 25;
                top = rightMost.top || 100;
            }
        }

        const seat = createSeat(left, top, selectedRowId, String(nextNum), canvas);
        canvas.add(seat);
        canvas.setActiveObject(seat);
        canvas.renderAll();
    };

    if (!selectedRowId || !currentRow) return null;

    return (
        <div className="space-y-4 rounded-md bg-white p-4 shadow">
            <h3 className="font-semibold">Row Properties</h3>
            <div>
                <label className="mb-1 block text-sm text-gray-600">Row Label</label>
                <input
                    type="text"
                    value={name}
                    onChange={handleNameChange}
                    className="w-full rounded border border-solid border-gray-200 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
                />
            </div>

            <div className="space-y-2">
                <label className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        checked={showLabelLeft}
                        onChange={handleLeftChange}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Show on Left</span>
                </label>
                <label className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        checked={showLabelRight}
                        onChange={handleRightChange}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Show on Right</span>
                </label>
            </div>

            <button
                onClick={handleAddSeat}
                className="w-full rounded bg-blue-600 py-1.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            >
                Add Seat to Row
            </button>

            <div className="text-xs text-gray-500">
                Row ID: {currentRow.id}
            </div>
        </div>
    );
};

export default RowProperties;
