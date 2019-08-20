import styled from '@emotion/styled';
import { theme } from 'styled-tools';
import { bgColorWithProps, ColorProps, textColorWithProps } from './styledProps';

const boxTheme = theme('Box');

export const Box = styled<'div', ColorProps>('div')`
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
