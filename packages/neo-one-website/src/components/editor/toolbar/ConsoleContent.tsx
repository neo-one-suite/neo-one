import * as React from 'react';
import { connect } from 'react-redux';
import { selectConsoleType } from '../redux';
import { ConsoleType, EditorFile, TextRange } from '../types';
import { ConsoleOutput } from './ConsoleOutput';
import { ProblemsView } from './ProblemsView';

interface Props {
  readonly files: ReadonlyArray<EditorFile>;
  readonly consoleType: ConsoleType;
  readonly onSelectRange: (file: EditorFile, range: TextRange) => void;
}

const ConsoleContentBase = ({ files, consoleType, onSelectRange, ...props }: Props) =>
  consoleType === 'output' ? (
    <ConsoleOutput {...props} />
  ) : (
    <ProblemsView files={files} onSelectRange={onSelectRange} {...props} />
  );

export const ConsoleContent = connect(selectConsoleType)(ConsoleContentBase);
