import * as React from 'react';
import { Box, Grid, styled } from 'reakit';
import { prop } from 'styled-tools';
import { AdjacentInfo } from '../../utils';
import { AdjacentLink } from './AdjacentLink';

interface Props {
  readonly next?: AdjacentInfo;
  readonly previous?: AdjacentInfo;
}

const Footer = styled(Grid)`
  grid-template: 'prev next';
  justify-content: space-between;
  padding: 16px;
  padding-right: 380px;
  background-color: ${prop('theme.black')};
  min-height: 88px;
  width: 100%;

  @media (max-width: ${prop('theme.breakpoints.md')}) {
    padding-right: 32px;
  }
`;

const NextLink = styled(AdjacentLink)`
  grid-area: next;
`;

const PrevLink = styled(AdjacentLink)`
  grid-area: prev;
`;

export const DocFooter = ({ next, previous }: Props) => (
  <Footer>
    {previous === undefined ? <Box grid-area="prev" /> : <PrevLink next={false} adjacent={previous} />}
    {next === undefined ? <Box grid-area="next" /> : <NextLink next={true} adjacent={next} />}
  </Footer>
);
