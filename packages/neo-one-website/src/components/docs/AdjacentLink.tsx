import { Link } from '@neo-one/react-common';
import * as React from 'react';
import { Link as RouterLink } from 'react-static';
import { as, Box, styled } from 'reakit';
import { prop } from 'styled-tools';
import { AdjacentInfo } from '../../utils';

export interface Props {
  readonly adjacent: AdjacentInfo;
  readonly next?: boolean;
}

const ArticleText = styled(Box)`
  ${prop('theme.fonts.axiformaRegular')};
  ${prop('theme.fontStyles.body1')};
  color: ${prop('theme.gray0')};
`;

const StyledLink = styled(as(RouterLink)(Link))`
  ${prop('theme.fontStyles.headline')};

  @media (max-width: ${prop('theme.breakpoints.md')}) {
    ${prop('theme.fontStyles.subheading')};
  }
`;

export const AdjacentLink = ({ adjacent, next = false, ...props }: Props) => {
  const adjacentPath = `/docs/${adjacent.slug}`;

  return (
    <Box {...props}>
      <ArticleText>{next ? 'Next Article' : 'Previous Article'}</ArticleText>
      <StyledLink linkColor="primary" to={adjacentPath}>
        {adjacent.title}
      </StyledLink>
    </Box>
  );
};
