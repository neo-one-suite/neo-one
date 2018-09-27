import { produce } from 'immer';
import _ from 'lodash';
import { createStore } from 'redux';
import actionCreatorFactory from 'typescript-fsa';
import { reducerWithInitialState } from 'typescript-fsa-reducers';
import { ConsoleType, FileDiagnostic } from './types';

const actionCreator = actionCreatorFactory();

export interface EditorState {
  readonly console: {
    readonly problems: ReadonlyArray<FileDiagnostic>;
    readonly output: string;
    readonly type: ConsoleType;
  };
}

const INITIAL_STATE: EditorState = {
  console: {
    output: '',
    type: 'problems',
    problems: [],
  },
};

interface SetFileProblems {
  readonly path: string;
  readonly problems: ReadonlyArray<FileDiagnostic>;
}

export const appendConsole = actionCreator<string>('UPDATE_FILE');
export const clearConsole = actionCreator('CLEAR_CONSOLE');
export const setConsoleType = actionCreator<ConsoleType>('SET_CONSOLE_TYPE');
export const setFileProblems = actionCreator<SetFileProblems>('SET_FILE_PROBLEMS');

const reducer = reducerWithInitialState(INITIAL_STATE)
  .case(appendConsole, (state, value) =>
    produce(state, (draft) => {
      draft.console.output += value;
    }),
  )
  .case(clearConsole, (state) =>
    produce(state, (draft) => {
      draft.console.output = '';
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
export const selectConsoleType = (state: EditorState) => ({
  consoleType: state.console.type,
});
