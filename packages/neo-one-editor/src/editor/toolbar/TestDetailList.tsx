// tslint:disable no-map-without-usage
import styled from '@emotion/styled';
import { Box } from '@neo-one/react-common';
import * as React from 'react';
import { TestSuite } from '../..//types';
import { TestDetailError } from './TestDetailError';
import { TestDetailListItem } from './TestDetailListItem';

const Wrapper = styled(Box)`
  display: grid;
  grid-gap: 8px;
  grid-auto-flow: row;
  min-height: 0;
  overflow: auto;
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
