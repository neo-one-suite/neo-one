// tslint:disable no-submodule-imports no-null-keyword
import { TrackJS } from '@neo-one/react-common';
// @ts-ignore
import run from 'jest-circus/build/run';
import {
  addEventHandler,
  ROOT_DESCRIBE_BLOCK_NAME,
  setState,
  // @ts-ignore
} from 'jest-circus/build/state';
// @ts-ignore
import { makeDescribe } from 'jest-circus/build/utils';
// @ts-ignore
import expect from 'jest-matchers';
import { formatError } from '../../error';
import { Test, TestRunnerCallbacks } from '../../types';
import { ModuleBase, RemoteEngine } from '../remote';
import { createTestEngine, CreateTestEngineOptions } from './createTestEngine';
import { BlockName, DescribeBlock, JestEvent, TestEntry } from './types';

const handleError = (error: Error) => {
  TrackJS.track(error);
};

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

const doRun = async (test: ModuleBase, handler: TestEventHandler): Promise<void> => {
  try {
    try {
      await test.evaluateAsync({
        force: true,
        beforeEvaluate: () => {
          resetTestState();
        },
        beforeFinalEvaluate: () => {
          doHandleEvent = (event) => {
            handler.handleTestEvent(event);
          };
        },
      });
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
  setTestsRunning: (running: boolean) => Promise<void>,
) => {
  mutableQueue.push({ test, handler });
  if (running) {
    return;
  }
  running = true;
  await setTestsRunning(true);

  let next = mutableQueue.shift();
  // tslint:disable-next-line no-loop-statement
  while (next !== undefined) {
    await doRun(next.test, next.handler);
    next = mutableQueue.shift();
  }

  running = false;
  await setTestsRunning(false);
};

interface TestEventHandler {
  readonly onEvaluateError: (error: Error) => void;
  readonly handleTestEvent: (event: JestEvent) => void;
}

const createHandleTestEvent = (engine: RemoteEngine, test: ModuleBase, callbacks: TestRunnerCallbacks) => {
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
      callbacks
        .onUpdateSuite({
          path: test.path,
          tests,
          error: {
            message: error.message,
            stack: error.stack,
          },
        })
        .catch(handleError);
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
            callbacks
              .onUpdateSuite({
                path: test.path,
                tests,
              })
              .catch(handleError);
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
          callbacks
            .onUpdateTest(test.path, {
              name: getTestName(event.test),
              status: 'skip',
            })
            .catch(handleError);
          break;
        case 'test_fn_success':
          callbacks
            .onUpdateTest(test.path, {
              name: getTestName(event.test),
              status: 'pass',
              duration: Date.now() - now,
            })
            .catch(handleError);
          break;
        case 'test_fn_failure':
          formatError(engine, event.test.errors[0][0])
            .then(async (err) =>
              callbacks.onUpdateTest(test.path, {
                name: getTestName(event.test),
                status: 'fail',
                duration: Date.now() - now,
                error: err,
              }),
            )
            .catch(handleError);
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

export interface TestRunnerOptions extends CreateTestEngineOptions {
  readonly callbacks: TestRunnerCallbacks;
}

export class TestRunner {
  private readonly engine: Promise<RemoteEngine>;
  private readonly callbacks: TestRunnerCallbacks;

  public constructor({ callbacks, ...options }: TestRunnerOptions) {
    this.engine = createTestEngine(options);
    this.callbacks = callbacks;
  }

  public async runTests() {
    const tests = await this.findTests();

    await Promise.all(tests.map(async (test) => this.runTest(test.path)));
  }

  public async runTest(path: string) {
    const engine = await this.engine;
    const test = engine.modules.get(path);

    if (test !== undefined) {
      await runTestsSerially(test, createHandleTestEvent(engine, test, this.callbacks), async (isRunning: boolean) =>
        this.callbacks.setTestsRunning(isRunning),
      );
    }
  }

  private async findTests(): Promise<ReadonlyArray<ModuleBase>> {
    const mutableTests: ModuleBase[] = [];
    const engine = await this.engine;
    engine.modules.forEach((mod, path) => {
      if (isTest(path)) {
        mutableTests.push(mod);
      }
    });

    return mutableTests;
  }
}
