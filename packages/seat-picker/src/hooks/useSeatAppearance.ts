
import { useEffect } from 'react';
import { fabric } from 'fabric';
import { CategoryInfo } from '@/types/data.types';

export const useSeatAppearance = (
    canvas: fabric.Canvas | null,
    categories?: CategoryInfo[]
) => {
    useEffect(() => {
        if (!canvas || !categories) return;

        const categoryMap = new Map(categories.map((c) => [c.id.toString(), c.color]));

        let needsRender = false;
        canvas.getObjects().forEach((obj: any) => {
            // Check for seats (circles or groups) that have a category
            const category = obj.category;

            if (!category) return;

            const catId = category.toString();
            const newColor = categoryMap.get(catId);

            if (!newColor) {
                // Category might have been deleted, or seat has invalid category
                // Only reset if it HAD a category but now doesn't match any
                if (catId) {
                    if (obj.customType === 'seat') {
                        // Handle generic seat (could be group or circle)
                        // If it's a group, we might need to find the inner shape, but if we standardize on Group for seats now...
                        // Let's assume we treat it appropriately based on internal structure or just set fill if it supports it
                        if (obj.type === 'group') {
                            const group = obj as fabric.Group;
                            const circle = group.getObjects().find((o: any) => o.type === 'circle');
                            if (circle) {
                                circle.set({ fill: 'transparent' });
                                (group as any).set({ category: null });
                                group.addWithUpdate();
                                needsRender = true;
                            }
                        } else {
                            // Fallback for simple shapes (backward compat if user allows, but we strictly check customType)
                            obj.set({ fill: 'transparent', category: null });
                            needsRender = true;
                        }
                    } else if (obj.type === 'group') { // Old fallback branch removed or kept if necessary? 
                        // User said strict customType: 'seat'. The above branch handles it.
                    }
                }
                return;
            }

            const isAvailable = obj.status === 'available' || !obj.status;

            if (isAvailable && obj.customType === 'seat') {
                if (obj.type === 'group') {
                    // It's a seat group, find the inner circle
                    const group = obj as fabric.Group;
                    const circle = group.getObjects().find((o: any) => o.type === 'circle');
                    if (circle && circle.fill !== newColor) {
                        circle.set('fill', newColor);
                        group.addWithUpdate(); // Needed to update group cache/display
                        needsRender = true;
                    }
                } else if (obj.type === 'circle') {
                    if (obj.fill !== newColor) {
                        obj.set('fill', newColor);
                        needsRender = true;
                    }
                }
            }
        });

        if (needsRender) {
            canvas.requestRenderAll();
        }
    }, [canvas, categories]);
};
