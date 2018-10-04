// tslint:disable no-null-keyword
import * as React from 'react';
import { MdPlayArrow } from 'react-icons/md';
import { connect } from 'react-redux';
import { EditorContext } from '../../EditorContext';
import { openConsole, selectConsoleTestsRunning } from '../redux';
import { ActionButtonBase } from './ActionButtonBase';

interface Props {
  readonly consoleTestsRunning: boolean;
  readonly openConsoleTests: () => void;
}

const RunTestsActionBase = ({ consoleTestsRunning, openConsoleTests, ...props }: Props) => (
  <EditorContext.Consumer>
    {({ engine }) => (
      <ActionButtonBase
        {...props}
        loading={consoleTestsRunning}
        icon={<MdPlayArrow />}
        text="Run Tests"
        onClick={() => {
          engine.runTests();
          openConsoleTests();
        }}
      />
    )}
  </EditorContext.Consumer>
);

export const RunTestsAction = connect(
  selectConsoleTestsRunning,
  (dispatch) => ({
    openConsoleTests: () => dispatch(openConsole('test')),
  }),
)(RunTestsActionBase);
