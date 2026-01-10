import { useMemo } from 'react';
import { CategoryInfo, Layout } from '../types/data.types';

export interface UseSeatMetadataResult {
    /**
     * Get row label by ID.
     * Falls back to '-' if not found.
     */
    getRowLabel: (rowId: string) => string;
}

export const useSeatMetadata = (
    layout: Layout,
): UseSeatMetadataResult => {

    const getRowLabel = (rowId: string): string => {
        const cleanId = String(rowId || '').trim();
        if (!cleanId) return '-';
        return layout.rows.find((r: any) => r.id === cleanId)?.name || '-';
    };

    return {
        getRowLabel,
    };
};
