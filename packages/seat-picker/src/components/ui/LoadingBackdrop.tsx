import React from "react";

interface LoadingBackdropProps {
  open: boolean;
  progress: number;
}

export const LoadingBackdrop: React.FC<LoadingBackdropProps> = ({ open, progress }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/50 text-white">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-white border-t-transparent"></div>
      <div className="mt-4 text-center">
        <h2 className="text-xl font-bold">Đang tải sơ đồ...</h2>
        <p className="mt-2 text-lg">{progress}%</p>
      </div>
    </div>
  );
};
