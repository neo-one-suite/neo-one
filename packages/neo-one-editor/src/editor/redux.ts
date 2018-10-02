import { OutputMessage } from '@neo-one/local-browser';
import { produce } from 'immer';
import _ from 'lodash';
import { createStore } from 'redux';
import actionCreatorFactory from 'typescript-fsa';
import { reducerWithInitialState } from 'typescript-fsa-reducers';
import { ConsoleType, FileDiagnostic } from './types';

const actionCreator = actionCreatorFactory();

export interface ConsoleOutput {
  readonly [owner: string]: string | undefined;
}

export interface EditorState {
  readonly console: {
    readonly problems: ReadonlyArray<FileDiagnostic>;
    readonly output: ConsoleOutput;
    readonly outputOwner: string;
    readonly type: ConsoleType;
  };
}

const INITIAL_STATE: EditorState = {
  console: {
    output: {},
    type: 'problems',
    outputOwner: '',
    problems: [],
  },
};

interface SetFileProblems {
  readonly path: string;
  readonly problems: ReadonlyArray<FileDiagnostic>;
}

export const appendConsole = actionCreator<OutputMessage>('UPDATE_FILE');
export const clearConsole = actionCreator<string>('CLEAR_CONSOLE');
export const setConsoleOwner = actionCreator<string>('SET_CONSOLE_OWNER');
export const setConsoleType = actionCreator<ConsoleType>('SET_CONSOLE_TYPE');
export const setFileProblems = actionCreator<SetFileProblems>('SET_FILE_PROBLEMS');

const reducer = reducerWithInitialState(INITIAL_STATE)
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
      draft.console.problems = _.sortBy(
        draft.console.problems.filter((problem) => problem.path !== path).concat(problems),
        (problem) => problem.path,
        (problem) => problem.startLineNumber,
      );
    }),
  );

export const configureStore = () => createStore(reducer);

export const selectConsoleProblems = (state: EditorState) => ({
  consoleProblems: state.console.problems,
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
