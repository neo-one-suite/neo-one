// tslint:disable no-null-keyword
import * as React from 'react';
import { Box, Grid, styled } from 'reakit';
import { prop } from 'styled-tools';
import { Test } from '../../types';
import { TestIcon } from './TestIcon';
import { TestText } from './TestText';

const Wrapper = styled(Grid)`
  grid-gap: 0;
  grid-auto-flow: row;
  background-color: ${prop('theme.gray5')};
`;

const NameWrapper = styled(Grid)`
  grid-gap: 8px;
  grid-auto-flow: column;
  grid-auto-columns: auto;
  justify-content: start;
`;

const HeaderWrapper = styled(Grid)`
  padding: 8px;
  grid-auto-flow: column;
  justify-items: space-between;
`;

const DurationWrapper = styled(Grid)`
  grid-gap: 8px;
  grid-auto-flow: column;
  grid-auto-columns: auto;
  justify-content: end;
`;

const ErrorWrapper = styled(Box)`
  padding: 8px;
  color: ${prop('theme.gray1')};
  background-color: ${prop('theme.gray4')};
  white-space: pre;
  min-height: 0;
  overflow: scroll;
`;

interface Props {
  readonly test: Test;
}
export const TestDetailListItem = ({ test, ...props }: Props) => (
  <Wrapper {...props}>
    <HeaderWrapper>
      <NameWrapper>
        <TestIcon
          running={test.status === 'running'}
          failing={test.status === 'fail'}
          passing={test.status === 'pass'}
        />
        <TestText>{test.name.join(' > ')}</TestText>
      </NameWrapper>
      <DurationWrapper>
        {test.status === 'pass' || test.status === 'fail' ? <TestText>{test.duration} ms</TestText> : <div />}
      </DurationWrapper>
    </HeaderWrapper>
    {test.status === 'fail' ? <ErrorWrapper>{test.error}</ErrorWrapper> : null}
  </Wrapper>
);
