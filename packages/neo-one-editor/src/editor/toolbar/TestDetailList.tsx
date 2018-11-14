// tslint:disable no-map-without-usage
import * as React from 'react';
import { Grid, styled } from 'reakit';
import { TestSuite } from '../..//types';
import { TestDetailError } from './TestDetailError';
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
  <Wrapper data-test="test-detail-list" {...props}>
    {testSuite.error === undefined ? (
      testSuite.tests.map((test) => <TestDetailListItem key={test.name.join(':')} test={test} />)
    ) : (
      <TestDetailError data-test="test-detail-list-error">
        {testSuite.error.stack === undefined ? testSuite.error.message : testSuite.error.stack}
      </TestDetailError>
    )}
  </Wrapper>
);
