"use client";

import * as React from 'react';
import { LuSave } from 'react-icons/lu';
import Modal from './Modal';

import { CategoryInfo, CategoryStats } from '../../types/data.types';

interface TicketCategoryModalProps {
    open: boolean;
    onClose: () => void;
    categories: CategoryInfo[];
    onSave: (categories: CategoryInfo[]) => void;
    stats?: Record<number, CategoryStats>;
    createCategoryUrl?: string;
}

export function TicketCategoryModal({ open, onClose, categories: initialCategories, onSave, stats, createCategoryUrl }: TicketCategoryModalProps) {
    const [categories, setCategories] = React.useState<CategoryInfo[]>(initialCategories);

    React.useEffect(() => {
        setCategories(initialCategories);
    }, [initialCategories]);

    // Handle color change
    const handleColorChange = (id: number, newColor: string) => {
        setCategories((prev) =>
            prev.map((cat) => (cat.id === id ? { ...cat, color: newColor } : cat))
        );
    };

    const handleSave = () => {
        onSave(categories);
        onClose();
    };

    const footer = (
        <div className="flex gap-2 justify-end">
            <button
                onClick={onClose}
                className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
            >
                Hủy
            </button>
            <button
                onClick={handleSave}
                className="flex items-center gap-1 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <LuSave className="mr-1" size={16} /> Lưu
            </button>
        </div>
    );

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Thiết lập hạng vé"
            footer={categories.length > 0 ? footer : undefined}
        >
            <div className="border-t border-gray-200 pt-0">
                {categories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                        <p className="text-sm text-gray-500 mb-4">
                            Suất diễn này chưa có hạng vé nào, vui lòng tạo hạng vé trước, sau đó khởi tạo sơ đồ.
                        </p>
                        {createCategoryUrl && (
                            <a
                                href={createCategoryUrl}
                                className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                            >
                                Khởi tạo ngay
                            </a>
                        )}
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {categories.map((category) => {
                            const catStats = stats?.[category.id];
                            return (
                                <li key={category.id} className="relative py-3 flex items-center justify-between gap-4">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-700 min-w-[120px]">{category.name}</span>
                                        {catStats && (
                                            <div className="text-xs text-gray-500 mt-1 flex gap-2">
                                                <span>Tổng: {catStats.total}</span>
                                                <span>• Đã đặt: {catStats.booked}</span>
                                                <span>• Đang chờ: {catStats.pending}</span>
                                                <span>• Bị khóa: {catStats.locked}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center flex-1 justify-end">
                                        <input
                                            type="color"
                                            value={category.color}
                                            onChange={(e) => handleColorChange(category.id, e.target.value)}
                                            className="h-8 w-8 rounded-md bg-transparent cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={category.color.toUpperCase()}
                                            onChange={(e) => handleColorChange(category.id, e.target.value)}
                                            className="ml-2 w-24 text-sm rounded-md border border-solid border-gray-200 px-2 py-1 shadow-sm uppercase"
                                        />
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </Modal>
    );
}
