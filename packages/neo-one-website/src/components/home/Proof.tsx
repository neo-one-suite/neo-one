import * as React from 'react';
import { Grid, styled } from 'reakit';
import { prop } from 'styled-tools';

const Wrapper = styled(Grid)`
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
`;

const Line = styled.p`
  ${prop('theme.fonts.axiformaRegular')};
  ${prop('theme.fontStyles.subheading')};
  color: ${prop('theme.black')};
`;

interface Props {
  readonly title: string;
  readonly lines: ReadonlyArray<string>;
}

export const Proof = ({ title, lines, ...props }: Props) => (
  <Wrapper {...props}>
    <Title>{title}</Title>
    {lines.map((line) => (
      <Line key={line}>{line}</Line>
    ))}
  </Wrapper>
);
