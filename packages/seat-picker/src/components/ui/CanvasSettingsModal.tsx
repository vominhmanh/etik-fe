import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { LuSave } from 'react-icons/lu';

interface CanvasSettingsModalProps {
  open: boolean;
  onClose: () => void;
  width: number;
  height: number;
  onSave: (width: number, height: number) => void;
}

export const CanvasSettingsModal: React.FC<CanvasSettingsModalProps> = ({
  open,
  onClose,
  width: initialWidth,
  height: initialHeight,
  onSave,
}) => {
  const [width, setWidth] = useState(initialWidth);
  const [height, setHeight] = useState(initialHeight);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setWidth(initialWidth);
      setHeight(initialHeight);
      setError('');
    }
  }, [open, initialWidth, initialHeight]);

  const handleSave = () => {
    if (width < 800 || height < 600) {
      setError('Kích thước tối thiểu là 800x600');
      return;
    }
    if (width > 5000 || height > 5000) {
      setError('Kích thước tối đa là 5000x5000');
      return;
    }
    setError('');
    onSave(width, height);
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
      title="Cài đặt giao diện thiết kế"
      footer={footer}
    >
      <div className="border-t border-gray-200 p-4">
        <p className="text-sm text-gray-500 mb-4">
          Điều chỉnh kích thước của khu vực vẽ sơ đồ. Kích thước nhỏ nhất là 800x600.
        </p>
        
        {error && (
          <p className="text-sm text-red-500 mb-4">{error}</p>
        )}

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chiều rộng (px)
            </label>
            <input
              type="number"
              min={800}
              max={5000}
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              className="w-full rounded-md border border-solid border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chiều cao (px)
            </label>
            <input
              type="number"
              min={600}
              max={5000}
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              className="w-full rounded-md border border-solid border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};
