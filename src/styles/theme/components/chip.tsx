import type { Components } from '@mui/material/styles';
import type { Theme } from '../types';

export const MuiChip = {
    styleOverrides: {
        root: { fontWeight: 500, borderRadius: '16px' },
    },
    variants: [
        {
            props: { variant: 'soft' },
            style: ({ ownerState, theme }: any) => {
                const color = ownerState.color || 'default';

                if (color === 'default') {
                    return {
                        backgroundColor: 'var(--mui-palette-neutral-100)',
                        color: 'var(--mui-palette-neutral-700)',
                        '&:hover': {
                            backgroundColor: 'var(--mui-palette-neutral-200)',
                        },
                    };
                }

                return {
                    backgroundColor: `var(--mui-palette-${color}-50)`,
                    color: `var(--mui-palette-${color}-700)`,
                    '&:hover': {
                        backgroundColor: `var(--mui-palette-${color}-100)`,
                    },
                    ...(theme.palette.mode === 'dark' && {
                        backgroundColor: `var(--mui-palette-${color}-900)`,
                        color: `var(--mui-palette-${color}-200)`,
                        '&:hover': {
                            backgroundColor: `var(--mui-palette-${color}-800)`,
                        },
                    }),
                };
            },
        },
    ],
} as any;
