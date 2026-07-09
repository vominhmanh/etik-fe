import React, { useState, useEffect } from 'react';
import { useEventGuiStore } from '@/zustand';
import useClipboardActions from '@/hooks/useClipboardActions';
import useUndoRedo from '@/hooks/useUndoRedo';
import { useLockSelection } from '@/hooks/useLockSelection';
import {
  LuFile,
  LuFolderOpen,
  LuSave,
  LuMousePointer,
  LuClipboardCheck,
  LuLayoutDashboard,
  LuPlus,
  LuGrid2X2,
  LuUndo,
  LuRedo,
  LuScissors,
  LuCopy,
  LuTrash2,
  LuZoomIn,
  LuZoomOut,
  LuLock,
  LuDownload,
  LuMaximize,
  LuMinimize,
  LuHexagon,
  LuImage,
} from 'react-icons/lu';
import {
  RiText,
  RiShapeLine,
  RiApps2AddLine,
  RiLockUnlockLine,
  RiCursorFill,
} from 'react-icons/ri';
import { ExportModal, OpenFileModal } from '@/components/modals';
import Toast from '@/components/ui/Toast';
import { applyCustomStyles, updateSeatVisuals } from '@/components/createObject/applyCustomStyles';
import { createSeat, createRect, createText } from '@/components/createObject';
import { CanvasObject } from '@/types/data.types';
import { exportCanvasToLiteJson } from '../../utils/liteJsonExporter';

interface ToolbarProps {
  onSave?: (json: any) => void;
  onBgLayout?: () => void;
  onToggleFullScreen?: () => void;
  isFullScreen?: boolean;
  categories?: any[];
  onSaveCategories?: (categories: any[]) => void;
  notify?: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  canvasWidth?: number;
  canvasHeight?: number;
  onDimensionsChange?: (width: number, height: number) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  onSave,
  onBgLayout,
  onToggleFullScreen,
  isFullScreen,
  categories,
  onSaveCategories,
  notify,
  canvasWidth,
  canvasHeight,
  onDimensionsChange,
}) => {
  const {
    toolMode,
    setToolMode,
    toolAction,
    setToolAction,
    canvas,
    snapEnabled,
    setSnapEnabled,
    zoomLevel,
    setZoomLevel,
    rows,
    setRows,
  } = useEventGuiStore();



  const { copySelectedObjects, cutSelectedObjects, pasteObjects } =
    useClipboardActions();
  const { undo, redo } = useUndoRedo();

  const { isSelectionLocked, toggleLockSelection } = useLockSelection(canvas);

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFileName, setExportFileName] = useState('seats.json');
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [openFile, setOpenFile] = useState<File | null>(null);
  const [openFileError, setOpenFileError] = useState('');

  // Export handler (LITE MODE)
  const handleExport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canvas) return;

    const canvasObjects = canvas.getObjects();
    const rowsLiteMap = new Map();

    rows.forEach(r => {
      rowsLiteMap.set(r.id, {
        id: r.id,
        name: r.name,
        showLabelLeft: r.showLabelLeft,
        showLabelRight: r.showLabelRight,
        fontSize: r.fontSize,
        seats: []
      });
    });

    const shapes: any[] = [];
    const texts: any[] = [];

    canvasObjects.forEach((obj: any) => {
      if (obj.isRowLabel) {
        const rowId = obj.rowId;
        if (rowId && rowsLiteMap.has(rowId)) {
          const labelInfo = {
            id: obj.id,
            x: obj.left,
            y: obj.top,
            fontSize: obj.fontSize,
            fill: obj.fill,
            angle: obj.angle,
          };
          if (obj.originX === 'right') {
            rowsLiteMap.get(rowId).labelLeft = labelInfo;
          } else {
            rowsLiteMap.get(rowId).labelRight = labelInfo;
          }
        }
      } else if (obj.customType === 'seat') {
        const rowId = obj.rowId;
        const seatLite = {
          id: obj.id,
          number: obj.seatNumber,
          categoryId: obj.category,
          price: obj.price,
          status: obj.status,
          x: obj.left,
          y: obj.top,
        };
        if (rowId && rowsLiteMap.has(rowId)) {
          rowsLiteMap.get(rowId).seats.push(seatLite);
        } else {
          if (!rowsLiteMap.has('unassigned')) {
             rowsLiteMap.set('unassigned', { id: 'unassigned', name: '', seats: [] });
          }
          rowsLiteMap.get('unassigned').seats.push(seatLite);
        }
      } else if (obj.type === 'rect') {
        shapes.push({
          id: obj.id,
          type: 'rect',
          x: obj.left,
          y: obj.top,
          width: obj.width * (obj.scaleX || 1),
          height: obj.height * (obj.scaleY || 1),
          fill: obj.fill,
          angle: obj.angle,
        });
      } else if (obj.type === 'i-text' || obj.type === 'text') {
        texts.push({
          id: obj.id,
          text: obj.text,
          x: obj.left,
          y: obj.top,
          fontSize: obj.fontSize,
          fill: obj.fill,
          angle: obj.angle,
        });
      }
    });

    const exportData = {
      isLite: true,
      categories,
      rows: Array.from(rowsLiteMap.values()),
      shapes,
      texts,
      settings: {
        background: canvas.backgroundColor || '#f8fafc',
        width: canvasWidth || 800,
        height: canvasHeight || 600
      }
    };

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const baseFileName = exportFileName.endsWith('.json') ? exportFileName.replace(/\.json$/, '') : exportFileName;
    a.download = baseFileName + '_lite.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  // ::::::::::::::::::: Function: toggle create multiple seats mode
  const toggleMultipleSeatMode = () => {
    setToolMode(toolMode === 'multiple-seat' ? 'select' : 'multiple-seat');
  };

  // Handle file input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setOpenFile(file);
  };

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setOpenFile(e.dataTransfer.files[0]);
    }
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Handle open file submit
  const handleOpenFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canvas || !openFile) return;
    try {
      const text = await openFile.text();
      const json = JSON.parse(text);

      let mergedCategories = [...(categories || [])];

      if (json.categories && Array.isArray(json.categories)) {
        const jsonColorMap = new Map(json.categories.map((c: any) => [c.id.toString(), c.color]));
        mergedCategories = mergedCategories.map(cat => {
          if (jsonColorMap.has(cat.id.toString())) {
            return { ...cat, color: jsonColorMap.get(cat.id.toString()) };
          }
          return cat;
        });
        if (onSaveCategories) {
          onSaveCategories(mergedCategories);
        }
      }

      if (json.isLite) {
        const pureRows = (json.rows || []).map((r: any) => {
          const { seats, ...rest } = r;
          return rest;
        }).filter((r: any) => r.id !== 'unassigned');
        
        setRows(pureRows);
        canvas.clear();
        canvas.backgroundColor = json.settings?.background || '#f8fafc';
        
        if (json.settings?.width && json.settings?.height && onDimensionsChange) {
           onDimensionsChange(json.settings.width, json.settings.height);
        }

        const objectsToAdd: any[] = [];
        (json.rows || []).forEach((row: any) => {
           (row.seats || []).forEach((seat: any) => {
              const seatObj = createSeat(seat.x, seat.y, row.id, seat.number);
              const customSeat = seatObj as any;
              customSeat.id = seat.id;
              customSeat.category = seat.categoryId;
              customSeat.price = seat.price;
              customSeat.status = seat.status || 'available';
              objectsToAdd.push(seatObj);
           });

           if (row.labelLeft && row.showLabelLeft) {
              const labelLeft = createText(row.labelLeft.x, row.labelLeft.y, row.name);
              const customLeft = labelLeft as any;
              customLeft.set({
                fontSize: row.labelLeft.fontSize || 16,
                fill: row.labelLeft.fill || '#666',
                selectable: true,
                evented: true,
                lockMovementX: false,
                lockMovementY: false,
                hasControls: false,
                hasBorders: true,
                excludeFromExport: true,
                originY: 'center',
                originX: 'right',
                angle: row.labelLeft.angle || 0
              });
              customLeft.id = row.labelLeft.id || `label-left-${row.id}`;
              customLeft.isRowLabel = true;
              customLeft.rowId = row.id;
              objectsToAdd.push(labelLeft);
           }
           if (row.labelRight && row.showLabelRight) {
              const labelRight = createText(row.labelRight.x, row.labelRight.y, row.name);
              const customRight = labelRight as any;
              customRight.set({
                fontSize: row.labelRight.fontSize || 16,
                fill: row.labelRight.fill || '#666',
                selectable: true,
                evented: true,
                lockMovementX: false,
                lockMovementY: false,
                hasControls: false,
                hasBorders: true,
                excludeFromExport: true,
                originY: 'center',
                originX: 'left',
                angle: row.labelRight.angle || 0
              });
              customRight.id = row.labelRight.id || `label-right-${row.id}`;
              customRight.isRowLabel = true;
              customRight.rowId = row.id;
              objectsToAdd.push(labelRight);
           }
        });

        (json.shapes || []).forEach((shape: any) => {
           if (shape.type === 'rect') {
             const rect = createRect(shape.x, shape.y);
             (rect as any).set({ width: shape.width, height: shape.height, fill: shape.fill, angle: shape.angle });
             (rect as any).id = shape.id;
             objectsToAdd.push(rect);
           }
        });

        (json.texts || []).forEach((t: any) => {
           const textObj = createText(t.x, t.y, t.text);
           (textObj as any).set({ fontSize: t.fontSize, fill: t.fill, angle: t.angle });
           (textObj as any).id = t.id;
           objectsToAdd.push(textObj);
        });

        canvas.add(...objectsToAdd);

        const validCategoryIds = new Set(mergedCategories.map((c: any) => c.id.toString()));
        const categoryMap = new Map(mergedCategories.map((c: any) => [c.id.toString(), c]));

        canvas.getObjects().forEach((obj: any) => {
           if (obj.customType === 'seat') {
             const categoryId = obj.category?.toString();
             let fillColor = 'transparent';
             if (categoryId && validCategoryIds.has(categoryId)) {
               const cat = categoryMap.get(categoryId);
               if (cat && cat.color) {
                 fillColor = cat.color;
               }
             } else {
               (obj as any).category = null;
               (obj as any).status = 'available';
             }

             updateSeatVisuals(obj, {
               fill: fillColor,
               stroke: fillColor,
               status: obj.status || 'available'
             });

             applyCustomStyles(obj);
           } else if (obj.type === 'rect' || obj.type === 'i-text' || obj.type === 'circle') {
             applyCustomStyles(obj);
           }
        });

        canvas.renderAll();
        setShowOpenModal(false);
        setOpenFile(null);
        if (notify) notify('Lite seating arrangement loaded!', 'success');
        return;
      }

      let canvasData = json;
      if (json.rows && Array.isArray(json.rows)) {
        setRows(json.rows);
        if (json.canvas) canvasData = json.canvas;
        if (json.settings?.width && json.settings?.height && onDimensionsChange) {
           onDimensionsChange(json.settings.width, json.settings.height);
        }
        canvas.renderAll();
        setShowOpenModal(false);
        setOpenFile(null);
        if (notify) notify('Seating arrangement loaded!', 'success');
      } else {
        setOpenFileError('Unsupported legacy layout format. Please use Lite JSON.');
        if (notify) notify('Unsupported legacy format.', 'error');
      }
    } catch (err) {
      setOpenFileError(
        'Invalid JSON file. Please select a valid seating arrangement file.'
      );
      if (notify) notify('Invalid JSON file.', 'error');
    }
  };

  const handleZoomIn = () => {
    setZoomLevel(Math.min(zoomLevel + 10, 250)); // Max zoom 250%
  };

  const handleZoomOut = () => {
    setZoomLevel(Math.max(zoomLevel - 10, 50)); // Min zoom 50%
  };

  // ::::::::::::::::::: Buttons data
  const buttonGroups = [
    [
      {
        icon: LuSave,
        tooltip: 'Save',
        onClick: () => {
          if (canvas && onSave) {
            const liteJson = exportCanvasToLiteJson(canvas, rows, canvasWidth || 800, canvasHeight || 600);
            onSave(liteJson as unknown as CanvasObject);
          }
        },
        state: false,
      },
    ],
    [
      {
        icon: LuFolderOpen,
        tooltip: 'Open File',
        onClick: () => setShowOpenModal(true),
        state: false,
      },
      {
        icon: LuDownload,
        tooltip: 'Download',
        onClick: () => setShowExportModal(true),
        state: false,
      },
    ],
    [
      {
        icon: LuMousePointer,
        tooltip: 'Select Row',
        onClick: () => setToolMode('select'),
        state: toolMode === 'select',
      },
      {
        icon: RiCursorFill,
        tooltip: 'Select Seat',
        onClick: () => setToolMode('select-seat'),
        state: toolMode === 'select-seat',
      },
      // {
      //   icon: LuGrid2X2,
      //   tooltip: snapEnabled ? 'Remove Grid' : 'Smart Grid',
      //   onClick: () => setSnapEnabled(!snapEnabled),
      //   state: snapEnabled,
      // },

    ],
    [
      {
        icon: RiApps2AddLine,
        tooltip: 'Add Rows',
        onClick: toggleMultipleSeatMode,
        state: toolMode === 'multiple-seat',
      },
      {
        icon: LuImage,
        tooltip: 'Layout Image',
        onClick: onBgLayout,
        state: false,
      },
      {
        icon: RiText,
        tooltip: 'Add Text',
        onClick: () => setToolMode('text'),
        state: toolMode === 'text',
      },
      {
        icon: RiShapeLine,
        tooltip: 'Add Square',
        onClick: () => setToolMode('shape-square'),
        state: toolMode === 'shape-square',
      },
      {
        icon: LuHexagon,
        tooltip: 'Add Polygon (Double click to finish)',
        onClick: () => setToolMode('shape-polygon'),
        state: toolMode === 'shape-polygon',
      }
    ],
    [
      { icon: LuUndo, tooltip: 'Undo', onClick: undo, state: false },
      { icon: LuRedo, tooltip: 'Redo', onClick: redo, state: false },
    ],
    [
      {
        icon: LuScissors,
        tooltip: 'Cut',
        onClick: cutSelectedObjects,
        state: toolAction === 'cut',
      },
      {
        icon: LuCopy,
        tooltip: 'Copy',
        onClick: copySelectedObjects,
        state: toolAction === 'copy',
      },
      {
        icon: LuClipboardCheck,
        tooltip: 'Paste',
        onClick: pasteObjects,
        state: toolAction === 'paste',
      },
      {
        icon: LuTrash2,
        tooltip: 'Delete',
        onClick: () => setToolAction('delete'),
        state: false,
      },
    ],
  ];

  return (
    <div className="relative z-[200] flex w-full items-center justify-center gap-1 bg-white px-[1rem] py-[0.5rem] shadow border-b border-gray-200">
      {/* :::::::::::::::: add space */}
      <div className="flex-1" />

      {buttonGroups.map((group, groupIdx) => (
        <React.Fragment key={groupIdx}>
          {groupIdx > 0 && <Separator />}
          {group.map((item, idx) => (
            <Button
              key={`button-${groupIdx}-${idx}`}
              icon={<item.icon className="h-4 w-4" />}
              tooltip={item.tooltip}
              onClick={item.onClick}
              state={item.state}
            />
          ))}
        </React.Fragment>
      ))}

      {/* :::::::::::::: add seperator */}
      <Separator />

      {/* :::::::::::::: zoom button */}
      <Button
        icon={<LuZoomOut className="h-4 w-4" />}
        tooltip="Zoom Out"
        onClick={handleZoomOut}
      />
      <div className="flex h-8 w-12 items-center justify-center text-sm font-medium">
        {zoomLevel}%
      </div>
      <Button
        icon={<LuZoomIn className="h-4 w-4" />}
        tooltip="Zoom In"
        onClick={handleZoomIn}
      />

      <Separator />

      {/* ::::::::::::::: Lock/Unlock button */}
      <Button
        icon={
          isSelectionLocked() ? (
            <LuLock className="h-4 w-4" />
          ) : (
            <RiLockUnlockLine className="h-4 w-4" />
          )
        }
        tooltip={isSelectionLocked() ? 'Unlock' : 'Lock'}
        onClick={toggleLockSelection}
      />

      {/* ::::::::::::::: add space */}
      <div className="flex-1" />

      {/* ::::::::::::::: Full Screen Button */}
      {onToggleFullScreen && (
        <Button
          icon={
            isFullScreen ? (
              <LuMinimize className="h-4 w-4" />
            ) : (
              <LuMaximize className="h-4 w-4" />
            )
          }
          tooltip={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
          onClick={onToggleFullScreen}
        />
      )}


      {/* Export Modal */}
      <ExportModal
        open={showExportModal}
        onClose={() => setShowExportModal(false)}
        fileName={exportFileName}
        setFileName={setExportFileName}
        onExport={handleExport}
      />

      {/* Open File Modal */}
      <OpenFileModal
        open={showOpenModal}
        onClose={() => {
          setShowOpenModal(false);
          setOpenFile(null);
          setOpenFileError('');
        }}
        file={openFile}
        setFile={setOpenFile}
        error={openFileError}
        onFileChange={handleFileChange}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onSubmit={handleOpenFile}
      />
    </div>
  );
};

export default Toolbar;

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  tooltip: string;
  state?: boolean;
}

const Button: React.FC<ButtonProps> = ({ icon, tooltip, state, ...props }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative">
      <button
        className={`rounded-md p-2 hover:bg-gray-200/60 ${state ? 'shadow-sm shadow-gray-400 ring-1 ring-gray-400' : ''
          } ease-250 active:bg-gray-200 `}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        {...props}
      >
        {icon}
      </button>

      <div
        className={`absolute left-1/2 -translate-x-1/2 transform ${showTooltip
          ? 'top-[calc(100%+0.5rem)] opacity-100'
          : 'top-[100%] opacity-0'
          } ease-250 whitespace-nowrap rounded bg-gray-200 px-2 py-1 text-[0.625rem] text-gray-900 shadow-md`}
      >
        {tooltip}
      </div>
    </div>
  );
};

const Separator: React.FC = () => (
  <div className="mx-[1rem] h-6 w-px bg-gray-300 " />
);
