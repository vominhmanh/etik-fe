import type { SxProps } from '@mui/material/styles';
import type { Theme } from './theme/types';

// Centralized styles and helpers for Event Studio pages

export const eventStudioStyles = {
  // Card that hosts horizontally scrollable actions (feature shortcuts)
  featureActionsCard: {
    height: '100%',
    overflowX: 'auto',
    display: { xs: 'none', sm: 'none', md: 'block' },
    '&::-webkit-scrollbar': { height: '4px' },
    '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
    '&::-webkit-scrollbar-thumb': (theme: Theme) => ({
      backgroundColor: theme.vars ? theme.vars.palette.neutral[300] : '#bbb',
      borderRadius: '5px',
    }),
    '&::-webkit-scrollbar-thumb:hover': (theme: Theme) => ({
      backgroundColor: theme.vars ? theme.vars.palette.neutral[500] : '#888',
    }),
    scrollbarWidth: 'thin',
    scrollbarColor: (theme: Theme) =>
      `${theme.vars ? theme.vars.palette.neutral[300] : '#bbb'} transparent`,
  } as SxProps<Theme>,

  // Same as above but visible on small screens
  featureActionsCardMobile: {
    height: '100%',
    overflowX: 'auto',
    display: { xs: 'block', sm: 'block', md: 'none' },
  } as SxProps<Theme>,

  // Banner wrapper aspect and presentation
  bannerWrapper: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16 / 6,
    overflow: 'hidden',
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 2.5, // 20px approx
    bgcolor: 'background.level1',
  } as SxProps<Theme>,
};

export const stylesHelpers = {
  // Common centered row layout
  centerRow: { display: 'flex', alignItems: 'center' } as const,
};


