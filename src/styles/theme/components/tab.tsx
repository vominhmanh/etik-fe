import type { Components } from '@mui/material/styles';

import type { Theme } from '../types';

export const MuiTab = {
  styleOverrides: {
    root: {
      fontSize: '12.5px',
      fontWeight: 500,
      lineHeight: 1.54,
      minWidth: 'auto',
      paddingLeft: 0,
      paddingRight: 0,
      textTransform: 'none',
      '& + &': { marginLeft: '24px' },
    },
  },
} satisfies Components<Theme>['MuiTab'];
