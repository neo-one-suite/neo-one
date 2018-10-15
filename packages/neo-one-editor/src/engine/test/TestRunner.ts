// tslint:disable no-submodule-imports no-null-keyword
// @ts-ignore
import jestTestHooks from 'jest-circus';
// @ts-ignore
import run from 'jest-circus/build/run';
import {
  addEventHandler,
  getState,
  ROOT_DESCRIBE_BLOCK_NAME,
  setState,
  // @ts-ignore
} from 'jest-circus/build/state';
// @ts-ignore
import { makeDescribe } from 'jest-circus/build/utils';
// @ts-ignore
import expect from 'jest-matchers';
// @ts-ignore
import jestMock from 'jest-mock';
import { Test, TestRunnerCallbacks } from '../../types';
import { Engine } from '../Engine';
import { ModuleBase } from '../ModuleBase';
import { BlockName, DescribeBlock, JestEvent, TestEntry } from './types';

function resetTestState() {
  // tslint:disable-next-line no-any
  (expect as any).setState({
    assertionCalls: 0,
    expectedAssertionsNumber: null,
    isExpectingAssertions: false,
    suppressedErrors: [],
    testPath: null,
    currentstring: null,
    snapshotState: null,
  });

  const rootDescribeBlock = makeDescribe(ROOT_DESCRIBE_BLOCK_NAME);
  setState({
    currentDescribeBlock: rootDescribeBlock,
    currentlyRunningTest: null,
    expand: undefined,
    hasFocusedTests: false,
    includeTestLocationInResult: false,
    parentProcess: null,
    rootDescribeBlock,
    testNamePattern: null,
    testTimeout: 30000,
    unhandledErrors: [],
  });
}

// tslint:disable-next-line no-let
let doHandleEvent: ((event: JestEvent) => void) | undefined;
const handleEvent = (event: JestEvent) => {
  if (doHandleEvent !== undefined) {
    doHandleEvent(event);
  }
};
addEventHandler(handleEvent);

const doRun = async (test: ModuleBase, handler: TestEventHandler) => {
  try {
    doHandleEvent = (event) => {
      handler.handleTestEvent(event);
    };
    resetTestState();

    try {
      test.evaluate({ force: true });
    } catch (error) {
      handler.onEvaluateError(error);

      return;
    }

    await run();
  } finally {
    doHandleEvent = undefined;
  }
};

interface TestQueueEntry {
  readonly test: ModuleBase;
  readonly handler: TestEventHandler;
}

const mutableQueue: TestQueueEntry[] = [];
// tslint:disable-next-line no-let
let running = false;
const runTestsSerially = async (
  test: ModuleBase,
  handler: TestEventHandler,
  setTestsRunning: (running: boolean) => void,
) => {
  mutableQueue.push({ test, handler });
  if (running) {
    return;
  }
  running = true;
  setTestsRunning(true);

  let next = mutableQueue.shift();
  // tslint:disable-next-line no-loop-statement
  while (next !== undefined) {
    await doRun(next.test, next.handler);
    next = mutableQueue.shift();
  }

  running = false;
  setTestsRunning(false);
};

interface TestEventHandler {
  readonly onEvaluateError: (error: Error) => void;
  readonly handleTestEvent: (event: JestEvent) => void;
}

const createHandleTestEvent = (test: ModuleBase, callbacks: TestRunnerCallbacks) => {
  let paths: ReadonlyArray<string> = [];
  let blockIndices: ReadonlyArray<number> = [];
  let tests: ReadonlyArray<Test> = [];
  let now = Date.now();

  const getBlockName = (blockName: BlockName) => {
    if (typeof blockName === 'string') {
      return blockName;
    }

    return '0';

    // const idx = paths.length;
    // const blockIndex = blockIndices[idx];
    // blockIndices = blockIndices.slice(0, idx).concat([blockIndex + 1]).concat(blockIndices.slice(idx + 1));

    // return `${blockIndex}`;
  };

  const getFinalBlockName = (block: DescribeBlock) => {
    if (typeof block.name === 'string') {
      return block.name;
    }

    return '0';
  };

  const getTestName = (entry: TestEntry) => {
    const getBlockNamesWorker = (block: DescribeBlock): ReadonlyArray<string> => {
      if (block.parent == undefined) {
        return [];
      }
      const parentNames = getBlockNamesWorker(block.parent);

      return parentNames.concat([getFinalBlockName(block)]);
    };

    return getBlockNamesWorker(entry.parent).concat([entry.name]);
  };

  return {
    onEvaluateError: (error: Error) => {
      callbacks.onUpdateSuite({
        path: test.path,
        tests,
        error,
      });
    },
    handleTestEvent: (event: JestEvent) => {
      switch (event.name) {
        case 'start_describe_definition':
          if (blockIndices.length !== paths.length + 1) {
            blockIndices = blockIndices.concat([0]);
          }
          paths = paths.concat([getBlockName(event.blockName)]);
          break;
        case 'finish_describe_definition':
          paths = paths.slice(0, -1);
          if (paths.length === 0) {
            callbacks.onUpdateSuite({
              path: test.path,
              tests,
            });
          }
          break;
        case 'add_test':
          if (event.mode === 'skip') {
            tests = tests.concat([
              {
                name: paths.concat([event.testName]),
                status: 'skip',
              },
            ]);
          } else {
            tests = tests.concat([
              {
                name: paths.concat([event.testName]),
                status: 'running',
              },
            ]);
          }
          break;
        case 'test_start':
          now = Date.now();
          break;
        case 'test_skip':
          callbacks.onUpdateTest(test.path, {
            name: getTestName(event.test),
            status: 'skip',
          });
          break;
        case 'test_fn_success':
          callbacks.onUpdateTest(test.path, {
            name: getTestName(event.test),
            status: 'pass',
            duration: Date.now() - now,
          });
          break;
        case 'test_fn_failure':
          callbacks.onUpdateTest(test.path, {
            name: getTestName(event.test),
            status: 'fail',
            duration: Date.now() - now,
            error:
              event.test.errors[0][0].stack === undefined
                ? event.test.errors[0][0].toString()
                : event.test.errors[0][0].stack,
          });
          break;
        case 'add_hook':
        case 'hook_start':
        case 'hook_success':
        case 'hook_failure':
        case 'test_fn_start':
        case 'run_describe_start':
        case 'run_describe_finish':
        case 'run_start':
        case 'run_finish':
          // do nothing
          break;
        default:
        // do nothing
      }
    },
  };
};

const isTest = (path: string) => {
  const endsWith = ['.test.js', '.test.ts', '.test.tsx', '.spec.js', '.spec.ts', '.spec.tsx'];

  if (
    path.includes('__tests__') &&
    (path.endsWith('.js') || path.endsWith('.jsx') || path.endsWith('.ts') || path.endsWith('.tsx'))
  ) {
    return true;
  }

  return endsWith.some((ext) => path.endsWith(ext));
};

export class TestRunner {
  public constructor(private readonly engine: Engine, private readonly callbacks: TestRunnerCallbacks) {}

  public getTestGlobals(_mod: ModuleBase) {
    return {
      ...jestTestHooks,
      expect,
      jest: {
        ...jestMock,
        setTimeout: (testTimeout: number) =>
          setState({
            ...getState(),
            testTimeout,
          }),
      },
    };
  }

  public async runTests() {
    const tests = this.findTests();

    await Promise.all(tests.map(async (test) => this.runTest(test.path)));
  }

  public async runTest(path: string) {
    const test = this.engine.modules.get(path);

    if (test !== undefined) {
      await runTestsSerially(test, createHandleTestEvent(test, this.callbacks), this.callbacks.setTestsRunning);
    }
  }

  public findTests(): ReadonlyArray<ModuleBase> {
    const mutableTests: ModuleBase[] = [];
    this.engine.modules.forEach((mod, path) => {
      if (isTest(path)) {
        mutableTests.push(mod);
      }
    });

    return mutableTests;
  }
}
