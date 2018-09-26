import * as React from 'react';
import { Box, Flex, Grid, keyframes, styled } from 'reakit';
import { prop } from 'styled-tools';
import { Monogram } from '../../elements';
import { Footer } from '../Footer';

const fadeInOut = keyframes`
  0% {
    opacity: 1;
  }

  50% {
    opacity: 0.1;
  }

  100% {
    opacity: 1;
  }
`;

const Wrapper = styled(Flex)`
  height: 100%;
  width: 100%;
  flex-direction: column;
`;

const LoadingWrapper = styled(Box)`
  padding-top: 96px;
  flex: 1 1 auto;
  min-height: 256px;
  background-color: ${prop('theme.gray6')};
`;

const MonogramWrapper = styled(Grid)`
  width: 100%;
  flex-direction: column;
  place-items: center;
  place-content: center;
  grid:
    'monogram' auto
    'text' auto
    / auto;
  grid-gap: 16px;
`;

const StyledMonogram = styled(Monogram)`
  animation: ${fadeInOut} 1.5s linear infinite;
`;

const StyledFooter = styled(Footer)`
  flex: 0 0 auto;
`;

export const Loading = () => (
  <Wrapper>
    <LoadingWrapper>
      <MonogramWrapper>
        <StyledMonogram />
      </MonogramWrapper>
    </LoadingWrapper>
    <StyledFooter />
  </Wrapper>
);
