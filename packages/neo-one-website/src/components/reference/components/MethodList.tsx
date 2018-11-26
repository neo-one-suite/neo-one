import { Box } from '@neo-one/react-common';
import * as React from 'react';
import styled from 'styled-components';
import { prop } from 'styled-tools';
import { Title } from '../common';
import { Method } from '../types';
import { MethodItem } from './MethodItem';

const ParameterLayout = styled(Box)`
  display: grid;
  grid-auto-flow: row;
  grid-gap: 32px;

  @media (max-width: ${prop('theme.breakpoints.md')}) {
    grid-gap: 16px;
  }
`;

interface Props {
  readonly methods: ReadonlyArray<Method>;
}

export const MethodList = ({ methods, ...props }: Props) => (
  <ParameterLayout {...props}>
    <Title>Methods</Title>
    {methods.map((method) => (
      <MethodItem key={method.title} method={method} />
    ))}
  </ParameterLayout>
);
