import styled from '@emotion/styled';
import { Box } from '@neo-one/react-common';
import { prop } from 'styled-tools';

export const TestDetailError = styled(Box)<{}, {}>`
  padding: 8px;
  color: ${prop('theme.gray1')};
  background-color: ${prop('theme.gray4')};
  white-space: pre;
  min-height: 0;
  overflow: auto;
`;
