import { Box } from '@neo-one/react-core';
import * as React from 'react';
import styled, { keyframes } from 'styled-components';
import { prop } from 'styled-tools';
import { Monogram } from './Monogram';

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

const LoadingWrapper = styled(Box)`
  padding-top: 96px;
  flex: 1 1 auto;
  min-height: 512px;
  background-color: ${prop('theme.gray6')};
`;

const MonogramWrapper = styled(Box)`
  display: grid;
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

export const Loading = () => (
  <LoadingWrapper>
    <MonogramWrapper>
      <StyledMonogram />
    </MonogramWrapper>
  </LoadingWrapper>
);
