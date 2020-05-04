import styled from '@emotion/styled';
import { Background, Box, H1 } from '@neo-one/react-common';
import * as React from 'react';
import { prop } from 'styled-tools';
import { Tagline } from '../elements';

// tslint:disable-next-line: no-any
const StyledBackground = styled<any>(Background)<any>`
  display: flex;
  color: ${prop('theme.gray0')};
  justify-content: center;
  height: 240px;
  width: 100%;
`;

const Headline = styled(H1)<{}, {}>`
  align-self: start;
  justify-self: start;
  color: ${prop('theme.primary')};
  ${prop('theme.headline')};
  ${prop('theme.axiformaRegular')};
`;

const Wrapper = styled(Box)`
  display: grid;
  grid-template-columns: '1fr 1fr';
  justify-items: center;
  align-items: center;
  width: 100%;
`;

export function Hero() {
  return (
    <StyledBackground>
      <Wrapper>
        <Tagline />
        <Headline>Learn to Code NEO DApps</Headline>
      </Wrapper>
    </StyledBackground>
  );
}
