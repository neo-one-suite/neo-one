import { Box, styled } from 'reakit';
import { prop } from 'styled-tools';

export const ProblemCount = styled(Box)`
  color: ${prop('theme.gray0')};
  ${prop('theme.font.axiformaRegular')};
  ${prop('theme.fontStyles.body1')};
`;
