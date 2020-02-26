import { keyframes } from '@emotion/core';
import styled from '@emotion/styled';
import { Box } from '@neo-one/react-core';
import * as React from 'react';
import { prop } from 'styled-tools';

const animation = keyframes`
  0%,
  80%,
  100% {
    transform: scale(0);
  }

  40% {
    transform: scale(1);
  }
`;

const Wrapper = styled(Box)<{}, {}>`
  height: 16px;
  display: grid;
  grid-auto-flow: column;
  align-items: center;

  & > div {
    width: 5.33333px;
    height: 5.33333px;
    background-color: ${prop('theme.accent')};
    border-radius: 100%;
    display: inline-block;
    animation: ${animation} 1.4s infinite ease-in-out;
    animation-fill-mode: both;
  }

  & > div:first-of-type {
    animation-delay: -0.32s;
  }

  & > div:nth-of-type(2) {
    animation-delay: -0.16s;
  }
`;

export const LoadingDots = (props: {}) => (
  <Wrapper {...props}>
    <div />
    <div />
    <div />
  </Wrapper>
);
