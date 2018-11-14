import { Background } from '@neo-one/react-common';
import * as React from 'react';
import { Box, Flex, Grid, styled } from 'reakit';
import { prop } from 'styled-tools';
import { Tagline } from '../elements';

const FlexBackground = Flex.as(Background);
const StyledBackground = styled(FlexBackground)`
  color: ${prop('theme.gray0')};
  justify-content: center;
  height: 240px;
  width: 100%;
`;

const Headline = styled(Box)`
  color: ${prop('theme.primary')};
  ${prop('theme.headline')};
  ${prop('theme.axiformaRegular')};
`;

export function Hero() {
  return (
    <StyledBackground>
      <Grid gap={24} columns="1fr 1fr" justifyItems="center" alignItems="center" width="100%">
        <Tagline />
        <Headline alignSelf="start" justifySelf="start">
          Learn to Code NEO DApps
        </Headline>
      </Grid>
    </StyledBackground>
  );
}
