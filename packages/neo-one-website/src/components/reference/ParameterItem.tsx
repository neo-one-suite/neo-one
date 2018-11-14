import { Box } from '@neo-one/react-common';
import * as React from 'react';
import styled from 'styled-components';
import { prop } from 'styled-tools';
import { Parameter } from './types';
import { buildText } from './utils';

const ParameterLayout = styled(Box)`
  display: grid;
  grid-auto-flow: column;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
  justify-items: start;
  align-items: baseline;
  border-bottom: 1px solid rgba(0, 0, 0, 0.3);
`;

const Name = styled(Box)`
  ${prop('theme.fonts.axiformaBold')};
  ${prop('theme.fontStyles.body1')};
`;

const Type = styled(Box)`
  ${prop('theme.fonts.axiformaRegular')};
  ${prop('theme.fontStyles.body1')};
`;

interface Props {
  readonly parameter: Parameter;
}

export const ParameterItem = ({ parameter, ...props }: Props) => (
  <ParameterLayout {...props}>
    <Name>{parameter.name}</Name>
    <Type>{buildText(parameter.type)}</Type>
    <Type>{buildText(parameter.description)}</Type>
  </ParameterLayout>
);
