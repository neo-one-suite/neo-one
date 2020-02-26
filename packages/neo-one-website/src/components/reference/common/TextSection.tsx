import styled from '@emotion/styled';
import { Box } from '@neo-one/react-common';
import * as React from 'react';
import { prop } from 'styled-tools';
import { WordTokens } from '../types';
import { Text } from './Text';
import { Title } from './Title';

const Wrapper = styled(Box)<{}, {}>`
  display: grid;
  grid-auto-flow: row;
  grid-gap: 32px;

  @media (max-width: ${prop('theme.breakpoints.md')}) {
    grid-gap: 16px;
  }
`;

interface Props {
  readonly title: string;
  readonly text: WordTokens;
  readonly subheading?: boolean;
}

export const TextSection = ({ title, text, subheading, ...props }: Props) => (
  <Wrapper {...props}>
    <Title subheading={subheading}>{title}</Title>
    <Text text={text} />
  </Wrapper>
);
