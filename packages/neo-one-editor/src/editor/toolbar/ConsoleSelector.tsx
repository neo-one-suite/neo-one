import { Selector } from '@neo-one/react-common';
import * as React from 'react';
import { connect } from 'react-redux';
import { ConsoleOutput, selectConsoleOutput, setConsoleOwner } from '../redux';

interface Props {
  readonly consoleOutput: ConsoleOutput;
  readonly owner: string;
  readonly onChange: (value: string) => void;
}

const ConsoleSelectorBase = ({ consoleOutput, owner, onChange, ...props }: Props) => (
  <Selector
    {...props}
    data-test="console-selector"
    options={Object.keys(consoleOutput)}
    selected={owner}
    onChange={onChange}
  />
);

export const ConsoleSelector = connect(selectConsoleOutput, (dispatch) => ({
  onChange: (owner: string) => dispatch(setConsoleOwner(owner)),
}))(ConsoleSelectorBase);
