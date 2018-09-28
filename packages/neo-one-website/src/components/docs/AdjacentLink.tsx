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
  display: flex;
  align-items: center;
  ${prop('theme.fonts.axiformaRegular')};
  font-size: 24px;
  height: 100%;
  width: 100%;
  color: ${prop('theme.primary')};

  &:hover {
    border-color: ${prop('theme.accent')};
    color: ${prop('theme.accent')};
  }

  &.active {
    border-color: ${prop('theme.accent')};
  }

  @media (max-width: ${prop('theme.breakpoints.md')}) {
    font-size: 16px;
  }
`;

export const AdjacentLink = ({ adjacent, next }: Props) => {
  const adjacentPath = `/docs/${adjacent.slug}`;

  return (
    <ul>
      <ArticleText>{next ? 'Next Article' : 'Previous Article'}</ArticleText>
      <NavigationLink to={adjacentPath}>{adjacent.title}</NavigationLink>
    </ul>
  );
};
