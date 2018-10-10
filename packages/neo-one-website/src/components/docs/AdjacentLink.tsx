import * as React from 'react';
import { Link as RouterLink } from 'react-static';
import { Box, styled } from 'reakit';
import { prop } from 'styled-tools';
import { AdjacentInfo } from '../../utils';

export interface Props {
  readonly adjacent: AdjacentInfo;
  readonly next: boolean;
}

const ArticleText = styled(Box)`
  ${prop('theme.fonts.axiformaRegular')};
  color: ${prop('theme.gray0')};

  @media (max-width: ${prop('theme.breakpoints.md')}) {
    font-size: 12px;
  }
`;

const NavigationLink = styled(RouterLink)`
  ${prop('theme.fonts.axiformaRegular')};
  ${prop('theme.fontStyles.headline')};
  color: ${prop('theme.primary')};

  &:hover {
    border-color: ${prop('theme.accent')};
    color: ${prop('theme.accent')};
  }

  &.active {
    border-color: ${prop('theme.accent')};
  }

  @media (max-width: ${prop('theme.breakpoints.md')}) {
    ${prop('theme.fontStyles.body2')};
  }
`;

export const AdjacentLink = ({ adjacent, next, ...props }: Props) => {
  const adjacentPath = `/docs/${adjacent.slug}`;

  return (
    <Box {...props}>
      <ArticleText>{next ? 'Next Article' : 'Previous Article'}</ArticleText>
      <NavigationLink to={adjacentPath}>{adjacent.title}</NavigationLink>
    </Box>
  );
};
