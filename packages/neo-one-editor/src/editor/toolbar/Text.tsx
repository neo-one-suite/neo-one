import { Box } from '@neo-one/react-common';
import styled from 'styled-components';
import { prop } from 'styled-tools';

export const Text = styled(Box)`
  color: ${prop('theme.gray0')};
  ${prop('theme.fonts.axiformaBook')};
  ${prop('theme.fontStyles.caption')};
`;
