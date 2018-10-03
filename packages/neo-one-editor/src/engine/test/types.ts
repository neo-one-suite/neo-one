// tslint:disable no-any ban-types
export type DoneFn = (reason?: string | Error) => void;
export type BlockFn = () => void;
export type BlockName = string | Function;
export type BlockMode = void | 'skip' | 'only';
export type TestMode = BlockMode;
export type TestName = string;
export type TestFn = (done?: DoneFn) => Promise<any> | undefined;
export type HookFn = (done?: DoneFn) => Promise<any> | undefined;
export type AsyncFn = TestFn | HookFn;
export type SharedHookType = 'afterAll' | 'beforeAll';
export type HookType = SharedHookType | 'afterEach' | 'beforeEach';
export interface Hook {
  readonly fn: HookFn;
  readonly type: HookType;
}
export type TestContext = object;
export type Exception = any; // Since in JS anything can be thrown as an error.
export type FormattedError = string; // String representation of error.

export type JestEvent =
  | {
      readonly mode: BlockMode;
      readonly name: 'start_describe_definition';
      readonly blockName: BlockName;
    }
  | {
      readonly name: 'finish_describe_definition';
    }
  | {
      readonly name: 'add_hook';
      readonly hookType: HookType;
      readonly fn: HookFn;
    }
  | {
      readonly name: 'add_test';
      readonly testName: TestName;
      readonly fn?: TestFn;
      readonly mode?: TestMode;
    }
  | {
      readonly name: 'hook_start';
      readonly hook: Hook;
    }
  | {
      readonly name: 'hook_success';
      readonly hook: Hook;
    }
  | {
      readonly name: 'hook_failure';
      readonly error: string | Exception;
      readonly hook: Hook;
    }
  | {
      readonly name: 'test_start';
      readonly test: TestEntry;
    }
  | {
      readonly name: 'test_success';
      readonly test: TestEntry;
    }
  | {
      readonly name: 'test_failure';
      readonly error: Exception;
      readonly test: TestEntry;
    }
  | {
      readonly name: 'test_skip';
      readonly test: TestEntry;
    }
  | {
      readonly name: 'run_describe_start';
      readonly describeBlock: DescribeBlock;
    }
  | {
      readonly name: 'run_describe_finish';
      readonly describeBlock: DescribeBlock;
    }
  | {
      readonly name: 'run_start';
    }
  | {
      readonly name: 'run_finish';
    };

export type TestStatus = 'pass' | 'fail' | 'skip';
export interface TestResult {
  readonly duration: number | undefined | null;
  readonly errors: ReadonlyArray<FormattedError>;
  readonly status: TestStatus;
  readonly testPath: ReadonlyArray<BlockName | TestName>;
}

export type TestResults = ReadonlyArray<TestResult>;

export interface State {
  readonly currentDescribeBlock: DescribeBlock;
  readonly hasFocusedTests: boolean; // that are defined using test.only
  readonly rootDescribeBlock: DescribeBlock;
  readonly testTimeout: number;
  readonly expand?: boolean; // expand error messages
}

export interface DescribeBlock {
  readonly children: ReadonlyArray<DescribeBlock>;
  readonly hooks: ReadonlyArray<Hook>;
  readonly mode: BlockMode;
  readonly name: BlockName;
  readonly parent: DescribeBlock | undefined | null;
  readonly tests: ReadonlyArray<TestEntry>;
}

export interface TestEntry {
  readonly errors: ReadonlyArray<Exception>;
  readonly fn: TestFn | undefined | null;
  readonly mode: TestMode;
  readonly name: TestName;
  readonly parent: DescribeBlock;
  readonly startedAt: number | undefined | null;
  readonly duration: number | undefined | null;
  readonly status: TestStatus | undefined | null;
}
