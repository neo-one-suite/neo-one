import { css } from '@emotion/core';
import { ifProp, theme } from 'styled-tools';
import { Box } from './Box';
import { styledOmitProps } from './utils';

const dividerTheme = theme('Divider');

export const Divider = styledOmitProps<{ readonly vertical?: boolean }>(
  Box.withComponent('hr'),
  ['vertical'],
  dividerTheme,
)`
  border-color: currentColor;
  border-style: solid;
  opacity: 0.2;
  ${ifProp(
    'vertical',
    css`
      margin: 0 1em;
      min-height: 100%;
      width: 0;
      border-width: 0 0 0 1px;
    `,
    css`
      margin: 1em 0;
      height: 0;
      border-width: 1px 0 0 0;
    `,
  )};
  ${dividerTheme};
`;
