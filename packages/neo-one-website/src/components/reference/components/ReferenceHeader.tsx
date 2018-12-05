import { Box } from '@neo-one/react-common';
import * as React from 'react';
import styled from 'styled-components';
import { prop } from 'styled-tools';
import { Example, Text, TypeIcon } from '../common';
import { ReferenceType, WordTokens } from '../types';

interface Props {
  readonly type: ReferenceType;
  readonly description: WordTokens;
  readonly definition: WordTokens;
}

const Wrapper = styled(Box)`
  display: grid;
  grid-gap: 16px;

  @media (max-width: ${prop('theme.breakpoints.md')}) {
    padding-left: 16px;
    padding-right: 16px;
  }
`;

export const ReferenceHeader = ({ type, description, definition, ...props }: Props) => (
  <Wrapper {...props}>
    <TypeIcon type={type} fullIcon />
    <Text text={description} />
    <Example example={definition} />
  </Wrapper>
);
