import * as React from 'react';
import { TestSuite } from '../../types';
import { TestIcon } from './TestIcon';

interface Props {
  readonly testSuite: TestSuite;
}
export const TestSuiteIcon = ({ testSuite, ...props }: Props) => {
  const failing = testSuite.tests.some((test) => test.status === 'fail') || testSuite.error !== undefined;
  const somePassing = testSuite.tests.some((test) => test.status === 'pass');
  const someRunning = testSuite.tests.some((test) => test.status === 'running');

  return <TestIcon {...props} failing={failing} passing={somePassing} running={someRunning} />;
};
