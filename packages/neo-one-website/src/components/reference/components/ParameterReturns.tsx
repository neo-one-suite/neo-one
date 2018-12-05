import { Box } from '@neo-one/react-common';
import * as React from 'react';
import styled from 'styled-components';
import { prop } from 'styled-tools';
import { TextSection } from '../common';
import { FunctionData } from '../types';
import { ParameterPropertyList } from './ParameterPropertyList';

export interface Props {
  readonly functionData: FunctionData;
  readonly subheading?: boolean;
}

const Wrapper = styled(Box)`
  display: grid;
  grid-auto-flow: row;
  grid-gap: 32px;

  @media (max-width: ${prop('theme.breakpoints.md')}) {
    grid-gap: 16px;
  }
`;

export const ParameterReturns = ({ functionData, subheading, ...props }: Props) => (
  <Wrapper {...props}>
    {functionData.parameters === undefined ? (
      undefined
    ) : (
      <ParameterPropertyList values={functionData.parameters} title="Parameters" subheading={subheading} />
    )}
    {functionData.returns === undefined ? (
      undefined
    ) : (
      <TextSection title="Returns" text={functionData.returns} subheading={subheading} />
    )}
  </Wrapper>
);
