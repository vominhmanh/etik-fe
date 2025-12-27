
import { useEffect } from 'react';
import { fabric } from 'fabric';
import { TicketCategory } from '@/types/data.types';

export const useSeatAppearance = (
    canvas: fabric.Canvas | null,
    categories?: TicketCategory[]
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
                    if (obj.type === 'circle') {
                        obj.set({ fill: 'transparent', category: null });
                        needsRender = true;
                    } else if (obj.type === 'group') {
                        // handle group reset if needed
                        const group = obj as fabric.Group;
                        const circle = group.getObjects().find((o: any) => o.type === 'circle');
                        if (circle) {
                            circle.set({ fill: 'transparent' });
                            (group as any).set({ category: null });
                            group.addWithUpdate();
                            needsRender = true;
                        }
                    }
                }
                return;
            }

            const isAvailable = obj.status === 'available' || !obj.status;

            if (isAvailable) {
                if (obj.type === 'circle') {
                    if (obj.fill !== newColor) {
                        obj.set('fill', newColor);
                        needsRender = true;
                    }
                } else if (obj.type === 'group' && (obj.rowId || obj.seatNumber)) {
                    // It's a seat group, find the inner circle
                    const group = obj as fabric.Group;
                    const circle = group.getObjects().find((o: any) => o.type === 'circle');
                    if (circle && circle.fill !== newColor) {
                        circle.set('fill', newColor);
                        group.addWithUpdate(); // Needed to update group cache/display
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
