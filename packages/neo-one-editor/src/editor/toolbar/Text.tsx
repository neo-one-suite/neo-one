import { Box, styled } from 'reakit';
import { prop } from 'styled-tools';

export const Text = styled(Box)`
  color: ${prop('theme.gray0')};
  ${prop('theme.fonts.axiformaBook')};
  ${prop('theme.fontStyles.caption')};
`;
