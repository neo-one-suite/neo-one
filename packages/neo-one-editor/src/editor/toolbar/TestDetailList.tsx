import * as React from 'react';
import { Grid, styled } from 'reakit';
import { TestSuite } from '../..//types';
import { TestDetailListItem } from './TestDetailListItem';

const Wrapper = styled(Grid)`
  grid-gap: 8px;
  grid-auto-flow: row;
  min-height: 0;
  overflow: scroll;
`;

interface Props {
  readonly testSuite: TestSuite;
}
export const TestDetailList = ({ testSuite, ...props }: Props) => (
  <Wrapper {...props}>
    {testSuite.tests.map((test) => (
      <TestDetailListItem key={test.name.join(':')} test={test} />
    ))}
  </Wrapper>
);
