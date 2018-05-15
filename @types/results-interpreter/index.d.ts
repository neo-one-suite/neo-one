import { Test } from 'test262-stream';
import { Writable } from 'stream';

export type TestResultType = 'fail' | 'pass';
export interface TestResult {
  id: string;
  expected: TestResultType;
  actual: TestResultType;
}
export interface ResultSummary {
  success: Test[];
  failure: Test[];
  falsePositive: Test[];
  falseNegative: Test[];
}
export interface TestResultSummary {
  allowed: ResultSummary;
  disallowed: ResultSummary;
  unrecognized: string[];
  passed: boolean;
}
export default class Interpreter extends Writable {
  constructor(file: string, options: any);
}
