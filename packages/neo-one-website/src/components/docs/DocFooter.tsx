import * as React from 'react';
import { Box, Grid, styled } from 'reakit';
import { prop } from 'styled-tools';
import { AdjacentInfo } from '../../utils';
import { AdjacentLink } from './AdjacentLink';

interface Props {
  readonly next?: AdjacentInfo;
  readonly previous?: AdjacentInfo;
}

const Wrapper = styled(Grid)`
  grid-auto-flow: column;
  justify-content: space-between;
  background-color: ${prop('theme.black')};
  min-height: 88px;
  padding: 16px;
`;

export const DocFooter = ({ next, previous, ...props }: Props) => (
  <Wrapper {...props}>
    {previous === undefined ? <Box /> : <AdjacentLink adjacent={previous} />}
    {next === undefined ? <Box /> : <AdjacentLink next adjacent={next} />}
  </Wrapper>
);
