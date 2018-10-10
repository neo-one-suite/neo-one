import * as React from 'react';
import { Box, Grid, styled } from 'reakit';
import { prop } from 'styled-tools';

const Wrapper = styled(Grid)<Props>`
  grid-gap: 4px;
  grid:
    'fail pass skip' auto
    / ${prop('failing')}fr ${prop('passing')}fr ${prop('skipped')}fr;
`;

const Bar = styled(Box)`
  height: 2px;
`;

const Failing = styled(Bar)`
  background-color: ${prop('theme.error')};
`;

const Passing = styled(Bar)`
  background-color: ${prop('theme.primaryDark')};
`;

const Skipped = styled(Bar)`
  background-color: ${prop('theme.gray1')};
`;

interface Props {
  readonly passing: number;
  readonly failing: number;
  readonly skipped: number;
}
export const TestStatusBar = ({ passing, failing, skipped, ...props }: Props) => (
  <Wrapper {...props} passing={passing} failing={failing} skipped={skipped} data-test="test-status-bar">
    <Failing />
    <Passing />
    <Skipped />
  </Wrapper>
);
