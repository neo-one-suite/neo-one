import styled from '@emotion/styled';
import { Box } from '@neo-one/react-common';
import { prop } from 'styled-tools';

export const Text = styled(Box)`
  color: ${prop('theme.gray0')};
  ${prop('theme.fonts.axiformaBook')};
  ${prop('theme.fontStyles.caption')};
`;
