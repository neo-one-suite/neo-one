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
  grid-auto-flow: column;
  justify-content: space-between;
  background-color: ${prop('theme.black')};
  min-height: 88px;
  padding: 16px;
`;

export const DocFooter = ({ next, previous, ...props }: Props) => (
  <Footer {...props}>
    {previous === undefined ? <Box grid-area="prev" /> : <AdjacentLink next={false} adjacent={previous} />}
    {next === undefined ? <Box grid-area="next" /> : <AdjacentLink next={true} adjacent={next} />}
  </Footer>
);
