import { css } from 'reakit';
import { prop } from 'styled-tools';

const backup: ReadonlyArray<string> = [
  '-apple-system',
  'system-ui',
  'BlinkMacSystemFont',
  'Segoe UI',
  'Roboto',
  'Oxygen',
  'Ubuntu',
  'Cantarell',
  'Fira Sans',
  'Droid Sans',
  'Helvetica Neue',
  'Arial',
  'sans-serif',
];

const axiforma = (font: string) =>
  [font, 'Questrial']
    .concat(backup)
    .map((f) => `"${f}"`)
    .join(', ');

export const theme = {
  primary: '#00FF9C',
  secondary: '#205C3B',
  primaryDark: '#00d180',
  primaryLight: '#00FF9C',
  black: '#2E2837',
  accent: '#9B98F6',
  error: '#FF466A',
  gray0: '#F8F5FD',
  grayHalf: '#F2EEF7',
  gray1: '#F2EAFE',
  gray2: '#CCBEE0',
  gray3: '#8E82A3',
  gray4: '#5B506B',
  gray5: '#40384C',
  gray6: '#362E43',
  hover: '#00d180',
  fonts: {
    axiformaBold: css`
      font-family: ${axiforma('Axiforma-Bold')};
      font-style: normal;
      font-weight: 700;
    `,
    axiformaRegular: css`
      font-family: ${axiforma('Axiforma-Regular')};
      font-style: normal;
      font-weight: 400;
    `,
    axiformaMedium: css`
      font-family: ${axiforma('Axiforma-Medium')};
      font-style: normal;
      font-weight: 500;
    `,
    axiformaSemiBold: css`
      font-family: ${axiforma('Axiforma-SemiBold')};
      font-weight: 600;
      font-style: normal;
    `,
    axiformaBook: css`
      font-family: ${axiforma('Axiforma-Book')};
      font-weight: 200;
      font-style: normal;
    `,
  },
  Base: css`
    box-sizing: border-box;
    ${prop('theme.fonts.axiformaRegular')};
  `,
};
