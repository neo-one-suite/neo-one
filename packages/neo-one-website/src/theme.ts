import { theme as oneTheme } from '@neo-one/react';
import { css } from 'reakit';

// tslint:disable-next-line no-unused-expression
export const theme = {
  ...oneTheme,
  breakpoints: {
    sm: 600,
    md: 960,
    lg: 1280,
    xl: 1920,
  },
  maxWidth: css`
    max-width: 1132px;
  `,
};
