import { Box, H2 } from '@neo-one/react-common';
import * as React from 'react';
import styled from 'styled-components';
import { prop } from 'styled-tools';
import { ParameterItem } from './ParameterItem';
import { Parameter } from './types';

const ParameterLayout = styled(Box)`
  display: grid;
  grid-auto-flow: row;
  gap: 16px;
`;

const Title = styled(H2)`
  ${prop('theme.fonts.axiformaBold')};
  ${prop('theme.fontStyles.headline')}
`;

interface Props {
  readonly parameters: ReadonlyArray<Parameter>;
}

export const ParameterList = ({ parameters, ...props }: Props) => (
  <ParameterLayout {...props}>
    <Title>Parameters</Title>
    {parameters.map((parameter) => (
      <ParameterItem key={parameter.name} parameter={parameter} />
    ))}
  </ParameterLayout>
);
