import * as React from 'react';
import { Grid, styled } from 'reakit';
import { TestSuite } from '../..//types';
import { TestSummaryListItem } from './TestSummaryListItem';

const Wrapper = styled(Grid)`
  grid-gap: 8px;
  grid-auto-flow: row;
  min-height: 0;
  overflow: scroll;
`;

interface Props {
  readonly testSuites: ReadonlyArray<TestSuite>;
  readonly selectedTestSuite?: string;
}
export const TestSummaryList = ({ testSuites, selectedTestSuite, ...props }: Props) => (
  <Wrapper {...props}>
    {testSuites.map((testSuite) => (
      <TestSummaryListItem key={testSuite.path} selected={selectedTestSuite === testSuite.path} testSuite={testSuite} />
    ))}
  </Wrapper>
);
