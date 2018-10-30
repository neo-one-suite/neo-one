import { OutputMessage } from '@neo-one/local-browser';
import { produce } from 'immer';
import _ from 'lodash';
import LogRocket from 'logrocket';
import { applyMiddleware, createStore } from 'redux';
import actionCreatorFactory from 'typescript-fsa';
import { reducerWithInitialState } from 'typescript-fsa-reducers';
import { Test, TestSuite } from '../types';
import { ConsoleType, FileDiagnostic } from './types';

const actionCreator = actionCreatorFactory();

export interface ConsoleOutput {
  readonly [owner: string]: string | undefined;
}

export interface FileProblems {
  readonly [path: string]: ReadonlyArray<FileDiagnostic>;
}

export interface EditorState {
  readonly console: {
    readonly open: boolean;
    readonly problems: FileProblems;
    readonly errorProblems: number;
    readonly warningProblems: number;
    readonly output: ConsoleOutput;
    readonly outputOwner: string;
    readonly type: ConsoleType;
    readonly testSuites: ReadonlyArray<TestSuite>;
    readonly selectedTestSuite?: string;
    readonly testsRunning: boolean;
  };
  readonly preview: {
    readonly enabled: boolean;
    readonly open: boolean;
  };
}

export interface InitialEditorStateOptions {
  readonly preview?: EditorState['preview'];
}

const createInitialState = (
  { preview = { enabled: true, open: false } }: InitialEditorStateOptions = {
    preview: { enabled: true, open: false },
  },
): EditorState => ({
  console: {
    open: false,
    output: {},
    type: 'problems',
    outputOwner: '',
    problems: {},
    errorProblems: 0,
    warningProblems: 0,
    testSuites: [],
    selectedTestSuite: undefined,
    testsRunning: false,
  },
  preview,
});

interface SetFileProblems {
  readonly path: string;
  readonly problems: ReadonlyArray<FileDiagnostic>;
}

interface UpdateTest {
  readonly path: string;
  readonly test: Test;
}

export const appendConsole = actionCreator<OutputMessage>('UPDATE_FILE');
export const clearConsole = actionCreator<string>('CLEAR_CONSOLE');
export const setConsoleOwner = actionCreator<string>('SET_CONSOLE_OWNER');
export const setConsoleType = actionCreator<ConsoleType>('SET_CONSOLE_TYPE');
export const setFileProblems = actionCreator<SetFileProblems>('SET_FILE_PROBLEMS');
export const selectTestSuite = actionCreator<string>('SELECT_TEST_SUITE');
export const updateTestSuite = actionCreator<TestSuite>('UPDATE_TEST_SUITE');
export const removeTestSuite = actionCreator<string>('REMOVE_TEST_SUITE');
export const updateTest = actionCreator<UpdateTest>('UPDATE_TEST');
export const setTestsRunning = actionCreator<boolean>('SET_TESTS_RUNNING');
export const setConsoleOpen = actionCreator<boolean>('SET_CONSOLE_OPEN');
export const openConsole = actionCreator<ConsoleType>('OPEN_CONSOLE');
export const clearStore = actionCreator<InitialEditorStateOptions | undefined>('CLEAR_STORE');
export const openPreview = actionCreator('OPEN_PREVIEW');
export const closePreview = actionCreator('CLOSE_PREVIEW');

const reducer = reducerWithInitialState(createInitialState())
  .case(appendConsole, (state, { owner, message }) =>
    produce(state, (draft) => {
      const current = draft.console.output[owner];
      draft.console.output[owner] =
        current === undefined ? message : current.endsWith('\n') ? current + message : `${current}\n${message}`;

      if (draft.console.outputOwner === '') {
        draft.console.outputOwner = owner;
      }
    }),
  )
  .case(clearConsole, (state, owner) =>
    produce(state, (draft) => {
      draft.console.output[owner] = undefined;
    }),
  )
  .case(setConsoleOwner, (state, owner) =>
    produce(state, (draft) => {
      draft.console.outputOwner = owner;
    }),
  )
  .case(setConsoleType, (state, consoleType) =>
    produce(state, (draft) => {
      draft.console.type = consoleType;
    }),
  )
  .case(setFileProblems, (state, { path, problems }) =>
    produce(state, (draft) => {
      const existingProblems = draft.console.problems[path] as ReadonlyArray<FileDiagnostic> | undefined;
      if (existingProblems === undefined || !_.isEqual(existingProblems, problems)) {
        draft.console.problems[path] = [...problems];
        const allProblems = _.flatten(Object.values(draft.console.problems));
        draft.console.errorProblems = allProblems.filter((problem) => problem.severity === 'error').length;
        draft.console.warningProblems = allProblems.filter((problem) => problem.severity === 'warning').length;
      }
    }),
  )
  .case(selectTestSuite, (state, selectedTestSuite) =>
    produce(state, (draft) => {
      draft.console.selectedTestSuite = selectedTestSuite;
    }),
  )
  .case(updateTestSuite, (state, testSuite) =>
    produce(state, (draft) => {
      const index = draft.console.testSuites.map((suite) => suite.path).indexOf(testSuite.path);
      const copiedTestSuite = {
        ...testSuite,
        tests: [...testSuite.tests.map((test) => ({ ...test, name: [...test.name] }))],
      };
      if (index === -1) {
        draft.console.testSuites.push(copiedTestSuite);
      } else {
        draft.console.testSuites[index] = copiedTestSuite;
      }

      if (draft.console.selectedTestSuite === undefined) {
        draft.console.selectedTestSuite = testSuite.path;
      }
    }),
  )
  .case(removeTestSuite, (state, path) =>
    produce(state, (draft) => {
      const index = draft.console.testSuites.map((suite) => suite.path).indexOf(path);
      if (index !== -1) {
        draft.console.testSuites = draft.console.testSuites
          .slice(0, index)
          .concat(draft.console.testSuites.slice(index + 1));

        if (draft.console.selectedTestSuite === path) {
          draft.console.selectedTestSuite = undefined;
          if (draft.console.testSuites.length > 0) {
            draft.console.selectedTestSuite = draft.console.testSuites[0].path;
          }
        }
      }
    }),
  )
  .case(updateTest, (state, { path, test }) =>
    produce(state, (draft) => {
      const testSuite = draft.console.testSuites.find((suite) => suite.path === path);
      if (testSuite !== undefined) {
        const foundTest = testSuite.tests.find((otherTest) => _.isEqual(test.name, otherTest.name));
        if (foundTest !== undefined) {
          const index = testSuite.tests.indexOf(foundTest);
          if (index !== -1) {
            // tslint:disable-next-line no-object-mutation no-array-mutation
            testSuite.tests[index] = {
              ...test,
              name: [...test.name],
            };
          }
        }
      }
    }),
  )
  .case(setTestsRunning, (state, running) =>
    produce(state, (draft) => {
      draft.console.testsRunning = running;
    }),
  )
  .case(setConsoleOpen, (state, open) =>
    produce(state, (draft) => {
      draft.console.open = open;
    }),
  )
  .case(openConsole, (state, consoleType) =>
    produce(state, (draft) => {
      draft.console.open = true;
      draft.console.type = consoleType;
    }),
  )
  .case(clearStore, (_state, options) => createInitialState(options))
  .case(openPreview, (state) =>
    produce(state, (draft) => {
      draft.preview.open = true;
    }),
  )
  .case(closePreview, (state) =>
    produce(state, (draft) => {
      draft.preview.open = false;
    }),
  );

export const configureStore = () => createStore(reducer, applyMiddleware(LogRocket.reduxMiddleware()));

export const selectConsoleProblems = (state: EditorState) => ({
  consoleProblems: state.console.problems,
});
export const selectConsoleErrorProblems = (state: EditorState) => ({
  consoleErrorProblems: state.console.errorProblems,
});
export const selectConsoleWarningProblems = (state: EditorState) => ({
  consoleWarningProblems: state.console.warningProblems,
});
export const selectConsoleOutput = (state: EditorState) => ({
  consoleOutput: state.console.output,
});
export const selectConsoleOutputOwner = (state: EditorState) => ({
  consoleOutputOwner: state.console.outputOwner,
});
export const selectConsoleType = (state: EditorState) => ({
  consoleType: state.console.type,
});
export const selectConsoleTestSuites = (state: EditorState) => ({
  consoleTestSuites: state.console.testSuites,
});
export const selectConsoleSelectedTestSuite = (state: EditorState) => ({
  consoleSelectedTestSuite: state.console.selectedTestSuite,
});
export const selectConsoleTestsRunning = (state: EditorState) => ({
  consoleTestsRunning: state.console.testsRunning,
});
export const selectConsoleOpen = (state: EditorState) => ({
  consoleOpen: state.console.open,
});
export const selectPreviewEnabled = (state: EditorState) => ({
  previewEnabled: state.preview.enabled,
});
export const selectPreviewOpen = (state: EditorState) => ({
  previewOpen: state.preview.open,
});
