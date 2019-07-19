// tslint:disable no-null-keyword
import { keyframes } from '@emotion/core';
import styled from '@emotion/styled';
import * as React from 'react';
import { MdLoop } from 'react-icons/md';
import { Text } from './Text';
import { Wrapper } from './Wrapper';

const rotate = keyframes`
  0% {
    transform: rotate(0deg);
  }

  50% {
    transform: rotate(180deg);
  }

  100% {
    transform: rotate(360deg);
  }
`;

const Loop = styled(MdLoop)`
  animation: ${rotate} 1.5s linear infinite;
`;

const GridWrapper = styled(Text)`
  display: grid;
  gap: 2px;
  grid-auto-flow: column;
`;

interface Props {
  readonly text: string;
  readonly icon: React.ReactNode;
  readonly onClick: () => void;
  readonly loading: boolean;
}

export const ActionButtonBase = ({ loading, text, onClick, icon, ...props }: Props) => (
  <Wrapper {...props} disabled={loading} onClick={onClick}>
    <GridWrapper>
      {loading ? <Loop /> : icon}
      {text}
    </GridWrapper>
  </Wrapper>
);
