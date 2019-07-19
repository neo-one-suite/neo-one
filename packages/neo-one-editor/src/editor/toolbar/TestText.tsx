import styled from '@emotion/styled';
import { Box } from '@neo-one/react-common';
import { prop } from 'styled-tools';

export const TestText = styled(Box)`
  ${prop('theme.fonts.axiformaRegular')};
  ${prop('theme.fontStyles.body1')};
  color: ${prop('theme.gray0')};
`;

export const TestTextDark = styled(TestText)`
  color: ${prop('theme.gray3')};
`;

export const TestPassing = styled(TestText)`
  color: ${prop('theme.primaryDark')};
`;

export const TestFailing = styled(TestText)`
  color: ${prop('theme.error')};
`;
