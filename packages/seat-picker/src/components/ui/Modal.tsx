import React from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ open, onClose, title, footer, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="min-w-[320px] max-w-[90vw] rounded-lg bg-white p-6 shadow-lg">
        {title && <h2 className="mb-4 text-lg font-semibold">{title}</h2>}
        {children}
        {footer ? (
          <div className="mt-4">{footer}</div>
        ) : (
          <button
            className="mt-4 w-full rounded border border-solid border-gray-300 bg-gray-200 px-4 py-1 text-sm hover:bg-gray-300"
            onClick={onClose}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

export default Modal;
