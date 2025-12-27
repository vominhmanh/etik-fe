
import { useRef, useState, useEffect } from 'react';
import { fabric } from 'fabric';

interface UseCanvasBackgroundProps {
    canvas: fabric.Canvas | null;
    readOnly: boolean;
    onUploadBackground?: (file: File) => Promise<string | null>;
}

export const useCanvasBackground = ({
    canvas,
    readOnly,
    onUploadBackground,
}: UseCanvasBackgroundProps) => {
    const [hasBgImage, setHasBgImage] = useState(false);
    const [bgOpacity] = useState(0.5);
    const bgInputRef = useRef<HTMLInputElement>(null);

    const setCanvasImage = (url: string) => {
        if (!canvas) return;

        // Remove existing background layout if any
        const existingBg = canvas
            .getObjects()
            .find((obj: any) => obj.customType === 'layout-background');
        if (existingBg) {
            canvas.remove(existingBg);
        }

        fabric.Image.fromURL(
            url,
            (img) => {
                img.set({
                    opacity: bgOpacity,
                    selectable: false, // Default locked
                    evented: !readOnly, // Allow events if editable (so we can double click)
                    hasControls: false,
                    lockRotation: true,
                    lockMovementX: true,
                    lockMovementY: true,
                    hoverCursor: 'default',
                    // @ts-ignore
                    customType: 'layout-background',
                });

                // Calculate scale to fit while maintaining aspect ratio
                const canvasWidth = canvas.width ?? 0;
                const canvasHeight = canvas.height ?? 0;
                const imgWidth = img.width ?? 1;
                const imgHeight = img.height ?? 1;

                const canvasRatio = canvasWidth / canvasHeight;
                const imgRatio = imgWidth / imgHeight;

                let scaleX;
                if (imgRatio > canvasRatio) {
                    // Image is wider than canvas
                    scaleX = canvasWidth / imgWidth;
                } else {
                    // Image is taller than canvas
                    // scaleY = canvasHeight / imgHeight;
                    scaleX = canvasHeight / imgHeight; // Use scaleY value for uniform scaling
                }

                img.scale(scaleX); // Uniform scaling

                // Center the image
                img.center();

                canvas.add(img);
                img.sendToBack();
                canvas.setActiveObject(img);
                canvas.renderAll();
                setHasBgImage(true);
            },
            { crossOrigin: 'anonymous' } as any
        );
    };

    const handleBgImageUpload = async (file: File) => {
        let imageUrl: string | null = null;
        if (onUploadBackground) {
            try {
                imageUrl = await onUploadBackground(file);
            } catch (error) {
                console.error('Values to upload background image:', error);
            }
        }

        if (!imageUrl) {
            // Fallback to local base64 if no upload handler or upload failed
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result) {
                    setCanvasImage(e.target.result as string);
                }
            };
            reader.readAsDataURL(file);
        } else {
            setCanvasImage(imageUrl);
        }
    };

    const handleRemoveBgImage = () => {
        if (canvas) {
            const bgObj = canvas
                .getObjects()
                .find((obj: any) => obj.customType === 'layout-background');
            if (bgObj) {
                canvas.remove(bgObj);
                canvas.renderAll();
            }
            setHasBgImage(false);
        }
    };

    // Sync validation of hasBgImage and lock status (BG & Zones) on readOnly change
    useEffect(() => {
        if (!canvas) return;

        const bgObj = canvas
            .getObjects()
            .find((obj: any) => obj.customType === 'layout-background');
        if (bgObj) setHasBgImage(true);
        else setHasBgImage(false);

        // Lock/Unlock Logic for BG and Zones
        canvas.getObjects().forEach((obj: any) => {
            if (
                obj.customType === 'layout-background' ||
                obj.customType === 'zone' ||
                obj.type === 'rect' ||
                obj.type === 'polygon' ||
                ((obj.type === 'i-text' || obj.type === 'text') && !obj.isRowLabel)
            ) {
                obj.set({
                    selectable: false,
                    evented: !readOnly,
                    hasControls: false,
                    lockRotation: true,
                    lockMovementX: true,
                    lockMovementY: true,
                    hoverCursor: !readOnly ? 'default' : undefined,
                });
            }
        });

        canvas.requestRenderAll();
    }, [canvas, readOnly]);

    // Handle Background Image Interaction (Lock/Unlock)
    useEffect(() => {
        if (!canvas || readOnly) return;

        const handleDblClick = (opt: fabric.IEvent) => {
            const target = opt.target as any;
            if (
                target &&
                (target.customType === 'layout-background' ||
                    target.customType === 'zone' ||
                    target.type === 'rect' ||
                    target.type === 'polygon' ||
                    ((target.type === 'i-text' || target.type === 'text') &&
                        !target.isRowLabel))
            ) {
                target.set({
                    selectable: true,
                    evented: true,
                    hasControls: true,
                    lockMovementX: false,
                    lockMovementY: false,
                    lockRotation: false,
                    hoverCursor: 'move',
                });
                canvas.setActiveObject(target);
                canvas.requestRenderAll();
            }
        };

        const handleSelectionChange = () => {
            canvas.getObjects().forEach((obj: any) => {
                if (
                    (obj.customType === 'layout-background' ||
                        obj.customType === 'zone' ||
                        obj.type === 'rect' ||
                        obj.type === 'polygon' ||
                        ((obj.type === 'i-text' || obj.type === 'text') &&
                            !obj.isRowLabel)) &&
                    canvas.getActiveObject() !== obj
                ) {
                    obj.set({
                        selectable: false,
                        evented: true,
                        hasControls: false,
                        lockMovementX: true,
                        lockMovementY: true,
                        lockRotation: true,
                        hoverCursor: 'default',
                    });
                }
            });
            canvas.requestRenderAll();
        };

        canvas.on('mouse:dblclick', handleDblClick);
        canvas.on('selection:cleared', handleSelectionChange);
        canvas.on('selection:created', handleSelectionChange);
        canvas.on('selection:updated', handleSelectionChange);

        return () => {
            canvas.off('mouse:dblclick', handleDblClick);
            canvas.off('selection:cleared', handleSelectionChange);
            canvas.off('selection:created', handleSelectionChange);
            canvas.off('selection:updated', handleSelectionChange);
        };
    }, [canvas, readOnly]);

    return {
        hasBgImage,
        setHasBgImage,
        bgInputRef,
        handleBgImageUpload,
        handleRemoveBgImage,
    };
};
