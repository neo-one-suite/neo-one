// tslint:disable no-null-keyword
import * as React from 'react';
import { EditorContext } from '../../EditorContext';
import { EditorContextType, TestSuite } from '../../types';
import { TestSummaryHeaderCommon } from './TestSummaryHeaderCommon';
import { TestTextDark } from './TestText';

interface Props {
  readonly testSuites: readonly TestSuite[];
}

export const TestSummaryHeader = ({ testSuites, ...props }: Props) => {
  const passing = testSuites.filter(
    (testSuite) =>
      testSuite.tests.every((test) => test.status === 'pass' || test.status === 'skip') &&
      testSuite.tests.some((test) => test.status === 'pass'),
  ).length;
  const failing = testSuites.filter(
    (testSuite) => testSuite.tests.some((test) => test.status === 'fail') || testSuite.error !== undefined,
  ).length;
  const skipped = testSuites.filter(
    (testSuite) => testSuite.tests.length > 0 && testSuite.tests.every((test) => test.status === 'skip'),
  ).length;
  const all = testSuites.length;
  const time = testSuites.reduce(
    (acc, testSuite) =>
      testSuite.tests.reduce(
        (innerAcc, test) => (test.status === 'pass' || test.status === 'fail' ? innerAcc + test.duration : innerAcc),
        acc,
      ),
    0,
  );
  const running = testSuites.some((testSuite) => testSuite.tests.some((test) => test.status === 'running'));

  return (
    <EditorContext.Consumer>
      {({ engine }: EditorContextType) => (
        <TestSummaryHeaderCommon
          {...props}
          data-test="test-summary-header"
          titleElement={<TestTextDark>{running ? 'Running Test Suites...' : 'Test Suites'}</TestTextDark>}
          passing={passing}
          failing={failing}
          skipped={skipped}
          total={all}
          time={time}
          runText="Run All Tests"
          onClickRun={() => engine.runTests()}
        />
      )}
    </EditorContext.Consumer>
  );
};
