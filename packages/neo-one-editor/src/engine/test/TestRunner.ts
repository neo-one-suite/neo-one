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
import { Engine } from '../Engine';
import { ModuleBase } from '../ModuleBase';
import { JestEvent } from './types';

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

const runners = new Set<TestRunner>();
const handleEvent = (event: JestEvent) => {
  runners.forEach((runner) => {
    runner.handleEvent(event);
  });
};
addEventHandler(handleEvent);

const doRun = async (runner: TestRunner) => {
  try {
    runners.add(runner);
    resetTestState();

    const tests = runner.findTests();

    tests.forEach((test) => {
      test.evaluate({ force: true });
    });

    await run();
  } finally {
    runners.delete(runner);
  }
};

interface TestQueueEntry {
  readonly runner: TestRunner;
}

const mutableQueue: TestQueueEntry[] = [];
// tslint:disable-next-line no-let
let running = false;
const runTestsSerially = async (runner: TestRunner) => {
  mutableQueue.push({ runner });
  if (running) {
    return;
  }
  running = true;

  let next = mutableQueue.shift();
  // tslint:disable-next-line no-loop-statement
  while (next !== undefined) {
    await doRun(next.runner);
    next = mutableQueue.shift();
  }

  running = false;
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
  public constructor(private readonly engine: Engine) {}

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
    await runTestsSerially(this);
  }

  public readonly handleEvent = (_message: JestEvent) => {
    // do nothing for now
  };

  public findTests(): ReadonlyArray<ModuleBase> {
    return Object.entries(this.engine.modules)
      .filter(([path]) => isTest(path))
      .map((value) => value[1]);
  }
}
