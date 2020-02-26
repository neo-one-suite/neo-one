import styled from '@emotion/styled';
import { Box } from '@neo-one/react-common';
import { prop } from 'styled-tools';

export const ProblemCount = styled(Box)<{}, {}>`
  color: ${prop('theme.gray0')};
  ${prop('theme.font.axiformaRegular')};
  ${prop('theme.fontStyles.body1')};
`;
