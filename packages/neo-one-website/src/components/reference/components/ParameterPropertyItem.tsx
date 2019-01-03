// tslint:disable no-null-keyword
import { Box } from '@neo-one/react-common';
import * as React from 'react';
import styled from 'styled-components';
import { prop } from 'styled-tools';
import { Text } from '../common';
import { Parameter, Property } from '../types';

const ParameterLayout = styled(Box)`
  display: grid;
  grid-auto-flow: column;
  grid-template-columns: 1fr 1fr 1fr;
  grid-gap: 16px;
  justify-items: start;
  align-items: baseline;
  border-bottom: 1px solid rgba(0, 0, 0, 0.3);
`;

const Name = styled(Box)`
  ${prop('theme.fonts.axiformaBold')};
  ${prop('theme.fontStyles.body1')};
`;

interface Props {
  readonly value: Parameter | Property;
}

export const ParameterPropertyItem = ({ value, ...props }: Props) => (
  <ParameterLayout {...props}>
    <Name>{value.name}</Name>
    {value.type === undefined ? null : <Text text={value.type} />}
    <Text text={value.description} />
  </ParameterLayout>
);
