import { theme } from 'styled-tools';
import { bgColorWithProps, textColorWithProps } from './styledProps';
import { styledOmitProps } from './utils';

const boxTheme = theme('Box');

export const Box = styledOmitProps('div', ['opaque', 'pallete', 'tone'], boxTheme)`
  margin: unset;
  padding: unset;
  border: unset;
  background: unset;
  font: unset;
  font-family: inherit;
  font-size: 100%;
  box-sizing: border-box;
  background-color: ${bgColorWithProps};
  color: ${textColorWithProps};
  ${boxTheme};
`;
