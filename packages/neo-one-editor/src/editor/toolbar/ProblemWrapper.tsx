import * as React from 'react';
import { Button, Grid, styled } from 'reakit';
import { prop } from 'styled-tools';

const Wrapper = styled(Button)`
  cursor: pointer;
  outline: none;
  width: 100%;

  &:hover {
    background-color: ${prop('theme.gray5')};
  }
`;

const GridWrapper = styled(Grid)`
  grid-auto-flow: column;
  grid-gap: 8px;
  align-items: start;
  justify-content: start;
`;

interface Props {
  readonly children?: React.ReactNode;
  // tslint:disable-next-line no-any
  readonly [key: string]: any;
}

export const ProblemWrapper = ({ children, 'data-test': dataTest, ...props }: Props) => (
  <Wrapper {...props} data-test={dataTest}>
    <GridWrapper data-test={dataTest}>{children}</GridWrapper>
  </Wrapper>
);
