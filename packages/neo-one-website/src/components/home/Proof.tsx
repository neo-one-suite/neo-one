import styled from '@emotion/styled';
import { Box } from '@neo-one/react-common';
import * as React from 'react';
import { prop } from 'styled-tools';

const Wrapper = styled(Box)`
  display: grid;
  margin-left: 8px;
  margin-right: 24px;
  grid-gap: 16px;
  align-items: start;
  align-content: start;
  min-width: 240px;

  @media (max-width: ${prop('theme.breakpoints.md')}) {
    min-width: 336px;
  }
`;

const Title = styled.h2`
  ${prop('theme.fonts.axiformaThin')};
  ${prop('theme.fontStyles.headline')};
  color: ${prop('theme.gray5')};
  margin: 0;
`;

const Line = styled.p`
  ${prop('theme.fonts.axiformaRegular')};
  ${prop('theme.fontStyles.subheading')};
  color: ${prop('theme.black')};
  margin: 0;
`;

interface Props {
  readonly title: string;
  readonly lines: readonly string[];
}

export const Proof = ({ title, lines, ...props }: Props) => (
  <Wrapper {...props}>
    <Title>{title}</Title>
    {lines.map((line) => (
      <Line key={line}>{line}</Line>
    ))}
  </Wrapper>
);
