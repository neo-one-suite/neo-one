// tslint:disable no-null-keyword
import styled from '@emotion/styled';
import { Box } from '@neo-one/react-common';
import * as React from 'react';
import { prop } from 'styled-tools';
import { Example, Text, Title } from '../common';
import { ExtraData } from '../types';

const Wrapper = styled(Box)<{}, {}>`
  display: grid;
  grid-auto-flow: row;
  grid-gap: 32px;

  @media (max-width: ${prop('theme.breakpoints.md')}) {
    grid-gap: 16px;
  }
`;

interface Props {
  readonly data: ExtraData;
}

export const Extra = ({ data, ...props }: Props) => (
  <Wrapper {...props}>
    {data.title === undefined ? null : <Title>{data.title}</Title>}
    {data.code ? <Example example={data.data} /> : <Text text={data.data} />}
  </Wrapper>
);
