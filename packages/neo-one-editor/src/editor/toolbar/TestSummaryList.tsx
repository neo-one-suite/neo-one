import { Box } from '@neo-one/react-common';
import * as React from 'react';
import styled from 'styled-components';
import { TestSuite } from '../../types';
import { TestSummaryListItem } from './TestSummaryListItem';

const Wrapper = styled(Box)`
  display: grid;
  grid-gap: 8px;
  grid-auto-flow: row;
  min-height: 0;
  overflow: auto;
`;

interface Props {
  readonly testSuites: ReadonlyArray<TestSuite>;
  readonly selectedTestSuite?: string;
}
export const TestSummaryList = ({ testSuites, selectedTestSuite, ...props }: Props) => (
  <Wrapper data-test="test-summary-list" {...props}>
    {testSuites.map((testSuite) => (
      <TestSummaryListItem key={testSuite.path} selected={selectedTestSuite === testSuite.path} testSuite={testSuite} />
    ))}
  </Wrapper>
);
