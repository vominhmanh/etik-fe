import type { Components } from '@mui/material/styles';
import type { Theme } from '../types';

export const MuiOutlinedInput = {
    styleOverrides: {
        input: {
            fontSize: '16px',
        },
    },
} satisfies Components<Theme>['MuiOutlinedInput'];