import * as React from 'react';
import { HexColorPicker } from 'react-colorful';
import { LuSave, LuX } from 'react-icons/lu';
import Modal from './Modal';

interface TicketCategory {
    id: number;
    name: string;
    color: string;
}

const MOCK_CATEGORIES: TicketCategory[] = [
    { id: 1, name: 'Vé VIP', color: '#f44336' },
    { id: 2, name: 'Vé thường', color: '#9c27b0' },
    { id: 3, name: 'Vé sinh viên', color: '#2196f3' },
];

interface TicketCategoryModalProps {
    open: boolean;
    onClose: () => void;
}

export function TicketCategoryModal({ open, onClose }: TicketCategoryModalProps) {
    const [categories, setCategories] = React.useState<TicketCategory[]>(MOCK_CATEGORIES);
    const [activeCategoryId, setActiveCategoryId] = React.useState<number | null>(null);

    // Handle color change
    const handleColorChange = (newColor: string) => {
        if (activeCategoryId !== null) {
            setCategories((prev) =>
                prev.map((cat) => (cat.id === activeCategoryId ? { ...cat, color: newColor } : cat))
            );
        }
    };

    const handleToggleColorPicker = (categoryId: number) => {
        setActiveCategoryId(activeCategoryId === categoryId ? null : categoryId);
    };

    const handleSave = () => {
        console.log('Saving categories:', categories);
        onClose();
    };

    const activeCategory = categories.find((c) => c.id === activeCategoryId);

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
            title="Hạng mục vé"
            footer={footer}
        >
            <div className="border-t border-gray-200 pt-0">
                <ul className="divide-y divide-gray-100">
                    {categories.map((category) => (
                        <li key={category.id} className="relative py-3">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => handleToggleColorPicker(category.id)}
                                    className="h-8 w-8 rounded-full border-2 border-white shadow-sm hover:shadow-md transition-shadow"
                                    style={{ backgroundColor: category.color, boxShadow: '0 0 0 1px #e5e7eb' }}
                                    title="Change Color"
                                />
                                <span className="text-sm font-medium text-gray-700">{category.name}</span>
                            </div>

                            {/* Inline Color Picker Popover */}
                            {activeCategoryId === category.id && (
                                <div className="absolute left-0 top-full z-10 mt-2 w-[240px] p-3 bg-white rounded-lg shadow-xl border border-gray-200">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-semibold text-gray-500">Pick a color</span>
                                        <button onClick={() => setActiveCategoryId(null)} className="text-gray-400 hover:text-gray-600">
                                            <LuX size={14} />
                                        </button>
                                    </div>
                                    <HexColorPicker
                                        color={category.color}
                                        onChange={handleColorChange}
                                        style={{ width: '100%', height: '150px' }}
                                    />
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
            {/* Backdrop for closing picker when clicking outside */}
            {activeCategoryId !== null && (
                <div className="fixed inset-0 z-0 bg-transparent" onClick={() => setActiveCategoryId(null)} />
            )}
        </Modal>
    );
}
