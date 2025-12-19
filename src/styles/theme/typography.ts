import type { TypographyOptions } from '@mui/material/styles/createTypography';

export const typography = {
  fontFamily:
    '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
  body1: { fontSize: '0.9rem', fontWeight: 400, lineHeight: 1.35 },
  body2: { fontSize: '0.7875rem', fontWeight: 400, lineHeight: 1.41 },
  button: { fontWeight: 500 },
  caption: { fontSize: '0.675rem', fontWeight: 400, lineHeight: 1.49 },
  subtitle1: { fontSize: '0.9rem', fontWeight: 500, lineHeight: 1.41 },
  subtitle2: { fontSize: '0.7875rem', fontWeight: 500, lineHeight: 1.41 },
  overline: {
    fontSize: '0.675rem',
    fontWeight: 500,
    letterSpacing: '0.5px',
    lineHeight: 1.8,
    textTransform: 'uppercase',
  },
  h1: { fontSize: '3.15rem', fontWeight: 500, lineHeight: 1.08 },
  h2: { fontSize: '2.7rem', fontWeight: 500, lineHeight: 1.08 },
  h3: { fontSize: '2.025rem', fontWeight: 500, lineHeight: 1.08 },
  h4: { fontSize: '1.8rem', fontWeight: 500, lineHeight: 1.08 },
  h5: { fontSize: '1.35rem', fontWeight: 500, lineHeight: 1.08 },
  h6: { fontSize: '1.0125rem', fontWeight: 500, lineHeight: 1.08 },
} satisfies TypographyOptions;
