import { fabric } from 'fabric';

export const exportCanvasToLiteJson = (
    canvas: fabric.Canvas,
    currentRows: any[],
    canvasWidth?: number,
    canvasHeight?: number
) => {
    // Discard active selection so all objects recalculate their absolute left/top coordinates relative to the canvas
    canvas.discardActiveObject();

    const objects = canvas.getObjects();
    
    // Initialize structure
    const liteJson = {
        isLite: true,
        version: '1.0',
        settings: {
            background: canvas.backgroundColor || '#f8fafc',
            width: canvasWidth || canvas.getWidth() || 800,
            height: canvasHeight || canvas.getHeight() || 600
        },
        rows: [] as any[],
        shapes: [] as any[],
        texts: [] as any[]
    };

    // Deep copy current rows to avoid mutating state
    const rowsMap = new Map();
    currentRows.forEach(row => {
        rowsMap.set(String(row.id), {
            id: row.id,
            name: row.name,
            showLabelLeft: row.showLabelLeft,
            labelLeft: row.labelLeft || {},
            showLabelRight: row.showLabelRight,
            labelRight: row.labelRight || {},
            seats: []
        });
    });

    objects.forEach((obj: any) => {
        if (obj.customType === 'layout-background') {
            return; // Ignore background image object for now, or handle if needed
        }

        if (obj.customType === 'seat') {
            const raw = obj.toJSON ? obj.toJSON(['id', 'category', 'price', 'rowLabel', 'rowId', 'seatNumber', 'customType', 'status']) : {};
            const rowId = String(raw.rowId || obj.rowId || '');
            
            const seatData = {
                id: obj.id || raw.id,
                x: obj.left,
                y: obj.top,
                number: obj.seatNumber || raw.seatNumber || '',
                categoryId: obj.category || raw.category || null,
                price: obj.price || raw.price || 0,
                status: obj.status || raw.status || 'available'
            };

            if (rowId && rowsMap.has(rowId)) {
                rowsMap.get(rowId).seats.push(seatData);
            }
        } else if (obj.isRowLabel) {
            const rowId = String(obj.rowId);
            if (rowId && rowsMap.has(rowId)) {
                const isLeft = obj.originX === 'right'; // In Toolbar, left label has originX: 'right'
                const labelData = {
                    x: obj.left,
                    y: obj.top,
                    fontSize: obj.fontSize,
                    fill: obj.fill,
                    angle: obj.angle || 0,
                    id: obj.id
                };
                if (isLeft) {
                    rowsMap.get(rowId).labelLeft = labelData;
                } else {
                    rowsMap.get(rowId).labelRight = labelData;
                }
            }
        } else if (obj.type === 'rect') {
            liteJson.shapes.push({
                id: obj.id,
                type: 'rect',
                x: obj.left,
                y: obj.top,
                width: obj.width * (obj.scaleX || 1),
                height: obj.height * (obj.scaleY || 1),
                fill: obj.fill,
                angle: obj.angle || 0
            });
        } else if (obj.type === 'i-text' || obj.type === 'text') {
            liteJson.texts.push({
                id: obj.id,
                x: obj.left,
                y: obj.top,
                text: obj.text,
                fontSize: obj.fontSize * (obj.scaleY || 1),
                fill: obj.fill,
                angle: obj.angle || 0
            });
        }
    });

    liteJson.rows = Array.from(rowsMap.values()).filter(row => row.seats && row.seats.length > 0);
    return liteJson;
};
