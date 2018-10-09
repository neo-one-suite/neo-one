import * as React from 'react';
import { connect } from 'react-redux';
import { selectConsoleType } from '../redux';
import { ConsoleType, TextRange } from '../types';
import { ConsoleOutput } from './ConsoleOutput';
import { ProblemsView } from './ProblemsView';
import { TestView } from './TestView';

interface Props {
  readonly consoleType: ConsoleType;
  readonly onSelectRange: (path: string, range: TextRange) => void;
}

const ConsoleContentBase = ({ consoleType, onSelectRange, ...props }: Props) =>
  consoleType === 'output' ? (
    <ConsoleOutput {...props} />
  ) : consoleType === 'problems' ? (
    <ProblemsView onSelectRange={onSelectRange} {...props} />
  ) : (
    <TestView {...props} />
  );

export const ConsoleContent = connect(selectConsoleType)(ConsoleContentBase);
