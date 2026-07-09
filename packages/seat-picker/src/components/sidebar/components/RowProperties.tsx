import React, { useEffect, useState, useMemo } from 'react';
import { fabric } from 'fabric';
import { v4 as uuidv4 } from 'uuid';
import { useEventGuiStore } from '@/zustand/store/eventGuiStore';
import { CustomFabricObject } from '@/types/fabric-types';
import { createSeat } from '../../createObject';

const RowProperties: React.FC = () => {
    const { selectedRowIds, rows, updateRow, deleteRow, canvas } = useEventGuiStore();
    const [name, setName] = useState('');
    const [showLabelLeft, setShowLabelLeft] = useState(false);
    const [showLabelRight, setShowLabelRight] = useState(false);

    const selectedRows = useMemo(() => {
        return rows.filter(r => selectedRowIds.includes(r.id));
    }, [rows, selectedRowIds]);

    const isMixedName = useMemo(() => {
        if (selectedRows.length <= 1) return false;
        const firstName = selectedRows[0]?.name;
        return !selectedRows.every(r => r.name === firstName);
    }, [selectedRows]);

    const isMixedLeft = useMemo(() => {
        if (selectedRows.length <= 1) return false;
        const first = selectedRows[0]?.showLabelLeft;
        return !selectedRows.every(r => r.showLabelLeft === first);
    }, [selectedRows]);

    const isMixedRight = useMemo(() => {
        if (selectedRows.length <= 1) return false;
        const first = selectedRows[0]?.showLabelRight;
        return !selectedRows.every(r => r.showLabelRight === first);
    }, [selectedRows]);

    useEffect(() => {
        if (selectedRows.length > 0) {
            setName(isMixedName ? '' : (selectedRows[0].name || ''));
            setShowLabelLeft(isMixedLeft ? false : (selectedRows[0].showLabelLeft || false));
            setShowLabelRight(isMixedRight ? false : (selectedRows[0].showLabelRight || false));
        }
    }, [selectedRows, isMixedName, isMixedLeft, isMixedRight]);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        setName(newName);
        selectedRowIds.forEach(id => {
            updateRow(id, { name: newName });
        });
    };

    const handleLeftChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.checked;
        setShowLabelLeft(val);
        selectedRowIds.forEach(id => {
            updateRow(id, { showLabelLeft: val });
        });
    };

    const handleRightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.checked;
        setShowLabelRight(val);
        selectedRowIds.forEach(id => {
            updateRow(id, { showLabelRight: val });
        });
    };

    const handleDeleteRow = () => {
        if (!canvas) return;

        const allObjects = canvas.getObjects() as CustomFabricObject[];

        // Discard selection so we can safely remove objects
        if (canvas.getActiveObject()?.type === 'activeSelection') {
            canvas.discardActiveObject();
        }

        selectedRowIds.forEach(id => {
            // Find all seats and labels for this row
            const rowObjects = allObjects.filter((o) => o.rowId === id);
            rowObjects.forEach(obj => canvas.remove(obj));
            deleteRow(id);
        });

        canvas.requestRenderAll();
    };

    const handleAddSeat = () => {
        if (!canvas || selectedRowIds.length === 0) return;

        // Ensure we work with absolute coordinates by breaking any active selection
        if (canvas.getActiveObject()?.type === 'activeSelection') {
            canvas.discardActiveObject();
            canvas.renderAll();
        }

        const allObjects = canvas.getObjects() as CustomFabricObject[];
        const newSeats: CustomFabricObject[] = [];

        selectedRowIds.forEach(id => {
            const rowSeats = allObjects.filter((o) => o.rowId === id && !o.isRowLabel);

            let nextNum = 1;
            let left = 100;
            let top = 100;
            let sourceSeat: CustomFabricObject | null = null;

            if (rowSeats.length > 0) {
                // Determine highest seat number to add to the right
                const maxNum = rowSeats.reduce((max, curr) => {
                    const num = parseInt(curr.seatNumber || '0') || 0;
                    return num > max ? num : max;
                }, -Infinity);

                nextNum = maxNum === -Infinity ? 1 : maxNum + 1;

                // Find the visually right-most seat
                let rightMost = rowSeats[0];
                let maxLeft = -Infinity;

                rowSeats.forEach((seat) => {
                    const seatRect = seat.getBoundingRect();
                    if (seatRect.left > maxLeft) {
                        maxLeft = seatRect.left;
                        rightMost = seat;
                    }
                });

                left = (rightMost.left || 0) + 25; // add to the right
                top = rightMost.top || 100;
                sourceSeat = rightMost;
            }

            let radius = 10;
            let fontSize = 10;
            if (sourceSeat && sourceSeat.type === 'group') {
                const group = sourceSeat as fabric.Group;
                const scale = group.scaleX || 1;
                const circle = group.getObjects().find(o => o.type === 'circle');
                const text = group.getObjects().find(o => o.type === 'text' || o.type === 'i-text');

                if (circle) {
                    radius = ((circle as any).radius || 10) * scale;
                }
                if (text) {
                    fontSize = ((text as any).fontSize || 10) * scale;
                }
            }

            const seat = createSeat(left, top, id, String(nextNum), canvas, { radius, fontSize });
            canvas.add(seat);
            newSeats.push(seat as any);
        });

        const allTargetObjects = canvas.getObjects().filter((o: any) => selectedRowIds.includes(o.rowId));
        // newSeats are already on canvas, so getObjects() includes them.
        
        if (allTargetObjects.length === 1) {
            canvas.setActiveObject(allTargetObjects[0]);
        } else if (allTargetObjects.length > 1) {
            canvas.setActiveObject(new fabric.ActiveSelection(allTargetObjects, { canvas }));
        }
        canvas.requestRenderAll();
    };

    if (selectedRowIds.length === 0 || selectedRows.length === 0) return null;

    return (
        <div className="space-y-4 rounded-md bg-white p-4 shadow">
            <h3 className="font-semibold">
                Row Properties {selectedRowIds.length > 1 ? `(${selectedRowIds.length} rows selected)` : ''}
            </h3>
            <div>
                <label className="mb-1 block text-sm text-gray-600">Row Label {isMixedName && <span className="text-gray-400 font-normal italic">- Mixed</span>}</label>
                <input
                    type="text"
                    value={name}
                    placeholder={isMixedName ? 'Mixed...' : ''}
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
                        ref={el => { if (el) el.indeterminate = isMixedLeft; }}
                    />
                    <span className="text-sm text-gray-700">Show on Left {isMixedLeft && <span className="text-gray-400 font-normal italic">- Mixed</span>}</span>
                </label>
                <label className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        checked={showLabelRight}
                        onChange={handleRightChange}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        ref={el => { if (el) el.indeterminate = isMixedRight; }}
                    />
                    <span className="text-sm text-gray-700">Show on Right {isMixedRight && <span className="text-gray-400 font-normal italic">- Mixed</span>}</span>
                </label>
            </div>

            <button
                onClick={handleAddSeat}
                className="w-full rounded bg-blue-600 py-1.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            >
                Add Seat to Row
            </button>

            <button
                onClick={handleDeleteRow}
                className="w-full rounded bg-red-500 py-1.5 text-sm font-medium text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
            >
                Delete Row
            </button>
        </div>
    );
};

export default RowProperties;
