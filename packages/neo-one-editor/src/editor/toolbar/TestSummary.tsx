import * as React from 'react';
import { Grid, styled } from 'reakit';
import { TestSuite } from '../../types';
import { TestSummaryHeader } from './TestSummaryHeader';
import { TestSummaryList } from './TestSummaryList';

const Wrapper = styled(Grid)`
  grid-gap: 8px;
  grid-auto-flow: row;
  grid-auto-rows: auto;
  align-content: start;
  padding-left: 8px;
  padding-right: 8px;
  padding-bottom: 8px;
  min-height: 0;
`;

interface Props {
  readonly testSuites: ReadonlyArray<TestSuite>;
  readonly selectedTestSuite?: string;
}

export const TestSummary = ({ selectedTestSuite, testSuites, ...props }: Props) => (
  <Wrapper {...props}>
    <TestSummaryHeader testSuites={testSuites} />
    <TestSummaryList selectedTestSuite={selectedTestSuite} testSuites={testSuites} />
  </Wrapper>
);
