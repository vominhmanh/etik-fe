import { useMemo } from 'react';
import { TicketCategory, CanvasObject } from '../types/data.types';

export interface CategoryInfo {
    id: string;
    name: string;
    color: string;
    price: number;
}

export interface UseSeatMetadataResult {
    /**
     * Get normalized category info by ID.
     * Handles merging between API data and Layout JSON.
     */
    getCategory: (id: string) => CategoryInfo;

    /**
     * Get row label by ID.
     * Falls back to '-' if not found.
     */
    getRowLabel: (rowId: string) => string;

    /**
     * List of all available categories for display (e.g. Legend).
     */
    displayCategories: CategoryInfo[];
}

export const useSeatMetadata = (
    layout: CanvasObject | Record<string, any>,
    ticketCategories: TicketCategory[] = []
): UseSeatMetadataResult => {

    const { categoryMap, rowMap, displayCategories } = useMemo(() => {
        const catMap = new Map<string, CategoryInfo>();
        const rMap = new Map<string, string>();

        // 1. Build Row Map from layout
        if ((layout as any)?.rows) {
            (layout as any).rows.forEach((r: any) => {
                if (r.id) rMap.set(String(r.id), r.name || '-');
            });
        }

        // 2. Build Category Map (Merge layout colors with prop data)
        // Priority: API Data (Name, Price) > Layout Data (Color)
        const layoutCats = (layout as any)?.categories || [];
        const propCats = ticketCategories || [];
        const mergedList: CategoryInfo[] = [];

        // Process API Categories first (Source of Truth for existence)
        propCats.forEach(pCat => {
            const pId = String(pCat.id);
            const lCat = layoutCats.find((l: any) => String(l.id) === pId);

            const merged: CategoryInfo = {
                id: pId,
                name: pCat.name,
                price: Number(pCat.price || 0),
                color: lCat?.color || pCat.color || '#cccccc'
            };

            catMap.set(pId, merged);
            mergedList.push(merged);
        });

        // Process Layout Categories (Fallback for items not in API but present in Layout)
        // This handles cases where visuals exist but API data might be missing/mismatched
        layoutCats.forEach((lCat: any) => {
            const lId = String(lCat.id);
            if (!catMap.has(lId)) {
                const fallback: CategoryInfo = {
                    id: lId,
                    name: lCat.name || 'Unknown',
                    price: Number(lCat.price || 0),
                    color: lCat.color || '#cccccc'
                };
                catMap.set(lId, fallback);
                // We generally don't add fallback categories to the Legend (mergedList) 
                // unless you explicitly want to show "Unknown" categories there.
                // For now, we only keep them in the Map for seat lookup.
            }
        });

        return { categoryMap: catMap, rowMap: rMap, displayCategories: mergedList };
    }, [layout, ticketCategories]);

    // Helper getters
    const getCategory = (id: string): CategoryInfo => {
        const cleanId = String(id || '').trim();
        if (!cleanId) return { id: '', name: 'Unknown', price: 0, color: '#999999' };

        return categoryMap.get(cleanId) || {
            id: cleanId,
            name: 'Unknown Category',
            price: 0,
            color: '#999999'
        };
    };

    const getRowLabel = (rowId: string): string => {
        const cleanId = String(rowId || '').trim();
        if (!cleanId) return '-';
        return rowMap.get(cleanId) || '-';
    };

    return {
        getCategory,
        getRowLabel,
        displayCategories
    };
};
