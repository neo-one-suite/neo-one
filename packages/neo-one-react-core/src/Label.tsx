import styled from 'styled-components';
import { theme } from 'styled-tools';
import { Box } from './Box';

export const Label = styled(Box.withComponent('label'))`
  display: inline-block;
  ${theme('Label')};
`;
