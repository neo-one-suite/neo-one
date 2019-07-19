// tslint:disable no-null-keyword
import styled from '@emotion/styled';
import { Box } from '@neo-one/react-common';
import _ from 'lodash';
import * as React from 'react';
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
    {data.constructorDefinition === undefined ? null : (
      <Wrapper>
        <Title>Constructor</Title>
        <MethodItem method={data.constructorDefinition} />
      </Wrapper>
    )}
    {data.properties === undefined || _.isEmpty(data.properties) ? null : (
      <ParameterPropertyList values={data.properties} title="Properties" />
    )}
    {data.staticMethods === undefined || _.isEmpty(data.staticMethods) ? null : (
      <MethodList methods={data.staticMethods} staticMethods />
    )}
    {data.methods === undefined || _.isEmpty(data.methods) ? null : <MethodList methods={data.methods} />}
  </Wrapper>
);
