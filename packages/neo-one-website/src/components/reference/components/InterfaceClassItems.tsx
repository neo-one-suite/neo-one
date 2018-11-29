import { Box } from '@neo-one/react-common';
import * as React from 'react';
import styled from 'styled-components';
import { prop } from 'styled-tools';
import { Title } from '../common';
import { ClassData, InterfaceData } from '../types';
import { MethodItem } from './MethodItem';
import { MethodList } from './MethodList';
import { ParameterPropertyList } from './ParameterPropertyList';

export interface Props {
  readonly data: ClassData | InterfaceData;
}

const Wrapper = styled(Box)`
  display: grid;
  grid-auto-flow: row;
  grid-gap: 40px;

  @media (max-width: ${prop('theme.breakpoints.md')}) {
    grid-gap: 24px;
  }
`;

export const InterfaceClassItems = ({ data, ...props }: Props) => (
  <Wrapper {...props}>
    {data.constructorDefinition === undefined ? (
      undefined
    ) : (
      <Wrapper>
        <Title>Constructor</Title>
        <MethodItem method={data.constructorDefinition} />
      </Wrapper>
    )}
    {data.properties === undefined ? undefined : <ParameterPropertyList values={data.properties} title="Properties" />}
    {data.methods === undefined ? undefined : <MethodList methods={data.methods} />}
  </Wrapper>
);
