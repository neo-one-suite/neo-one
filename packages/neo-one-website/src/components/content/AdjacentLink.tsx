import styled from '@emotion/styled';
import { Box } from '@neo-one/react-common';
import * as React from 'react';
import { ifProp, prop } from 'styled-tools';
import { AdjacentInfo } from '../../types';
import { StyledRouterLink } from '../StyledRouterLink';

export interface Props {
  readonly adjacent: AdjacentInfo;
  readonly next?: boolean;
}

const ArticleText = styled<typeof Box, { readonly next: boolean }>(Box)`
  ${prop('theme.fonts.axiformaRegular')};
  ${prop('theme.fontStyles.caption')};
  color: ${prop('theme.gray0')};
  text-align: ${ifProp('next', 'right', 'left')};
  padding-bottom: 8px;
`;

const StyledLink = styled(StyledRouterLink)`
  ${prop('theme.fonts.axiformaRegular')};
  ${prop('theme.fontStyles.display1')};

  @media (max-width: ${prop('theme.breakpoints.md')}) {
    ${prop('theme.fontStyles.headline')};
  }
`;

export const AdjacentLink = ({ adjacent, next = false, ...props }: Props) => (
  <Box {...props}>
    <ArticleText next={next}>{next ? 'Next Article' : 'Previous Article'}</ArticleText>
    <StyledLink linkColor="primary" to={adjacent.slug}>
      {adjacent.title}
    </StyledLink>
  </Box>
);
