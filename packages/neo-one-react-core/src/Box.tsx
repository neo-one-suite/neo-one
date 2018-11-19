import styled from 'styled-components';
import { theme } from 'styled-tools';
import { bgColorWithProps, ColorProps, textColorWithProps } from './styledProps';
import { use } from './use';

export const Box = styled(use('div'))<ColorProps>`
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
  ${theme('Box')};
`;
