// tslint:disable no-null-keyword
import styled from '@emotion/styled';
import { Box } from '@neo-one/react-common';
import * as React from 'react';
import { EditorContext } from '../../EditorContext';
import { EditorContextType, TestSuite } from '../../types';
import { FileText } from './FileText';
import { TestSuiteIcon } from './TestSuiteIcon';
import { TestSummaryHeaderCommon } from './TestSummaryHeaderCommon';

const TitleElementWrapper = styled(Box)`
  display: grid;
  grid-gap: 4px;
  grid-auto-flow: column;
  justify-content: start;
  align-items: center;
`;

interface Props {
  readonly testSuite: TestSuite;
}

export const TestDetailHeader = ({ testSuite, ...props }: Props) => {
  const passing = testSuite.tests.filter((test) => test.status === 'pass').length;
  const failing =
    testSuite.tests.filter((test) => test.status === 'fail').length + (testSuite.error === undefined ? 0 : 1);
  const skipped = testSuite.tests.filter((test) => test.status === 'skip').length;
  const all = testSuite.tests.length + (testSuite.error === undefined ? 0 : 1);
  const time = testSuite.tests.reduce(
    (innerAcc, test) => (test.status === 'pass' || test.status === 'fail' ? innerAcc + test.duration : innerAcc),
    0,
  );

  return (
    <EditorContext.Consumer>
      {({ engine }: EditorContextType) => (
        <TestSummaryHeaderCommon
          {...props}
          data-test="test-detail-header"
          titleElement={
            <TitleElementWrapper>
              <TestSuiteIcon testSuite={testSuite} />
              <FileText data-test="test-detail-header-file-text" path={testSuite.path} />
            </TitleElementWrapper>
          }
          passing={passing}
          failing={failing}
          skipped={skipped}
          total={all}
          time={time}
          runText="Run File Tests"
          onClickRun={() => engine.runTest(testSuite.path)}
        />
      )}
    </EditorContext.Consumer>
  );
};
