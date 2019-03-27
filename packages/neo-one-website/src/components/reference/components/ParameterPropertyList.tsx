import { Box } from '@neo-one/react-common';
import * as React from 'react';
import styled from 'styled-components';
import { prop } from 'styled-tools';
import { Title } from '../common';
import { Parameter, Property } from '../types';
import { ParameterPropertyItem } from './ParameterPropertyItem';

const ParameterLayout = styled(Box)`
  display: grid;
  grid-auto-flow: row;
  grid-gap: 32px;

  @media (max-width: ${prop('theme.breakpoints.md')}) {
    grid-gap: 16px;
  }
`;

interface Props {
  readonly values?: ReadonlyArray<Parameter | Property>;
  readonly subheading?: boolean;
  readonly title: string;
}

export const ParameterPropertyList = ({ values = [], subheading, title, ...props }: Props) => (
  <ParameterLayout {...props}>
    <Title subheading={subheading}>{title}</Title>
    {values.map((value) => (
      <ParameterPropertyItem key={value.name} value={value} />
    ))}
  </ParameterLayout>
);
