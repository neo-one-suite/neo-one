import * as React from 'react';
import { MdError, MdWarning } from 'react-icons/md';
import { connect } from 'react-redux';
import { as, Grid, styled } from 'reakit';
import {
  EditorState,
  openConsole,
  selectConsoleOpen,
  selectConsoleProblems,
  selectConsoleType,
  setConsoleOpen,
} from '../redux';
import { ConsoleType, FileDiagnostic } from '../types';
import { Text } from './Text';
import { Wrapper } from './Wrapper';

const GridWrapper = styled(as(Text)(Grid))`
  gap: 2px;
  grid-auto-flow: column;
`;

interface Props {
  readonly consoleProblems: ReadonlyArray<FileDiagnostic>;
  readonly consoleType: ConsoleType;
  readonly consoleOpen: boolean;
  readonly onOpen: () => void;
  readonly onClose: () => void;
}

const ProblemsBase = ({ consoleProblems, consoleType, consoleOpen, onOpen, onClose, ...props }: Props) => (
  <Wrapper data-test="problems" onClick={consoleOpen && consoleType === 'problems' ? onClose : onOpen} {...props}>
    <GridWrapper>
      <MdError />
      <span data-test="problems-problem-count">
        {consoleProblems.filter((problem) => problem.severity === 'error').length}
      </span>
      <MdWarning />
      <span data-test="problems-warning-count">
        {consoleProblems.filter((problem) => problem.severity === 'warning').length}
      </span>
    </GridWrapper>
  </Wrapper>
);

export const Problems = connect(
  (state: EditorState) => ({
    ...selectConsoleProblems(state),
    ...selectConsoleOpen(state),
    ...selectConsoleType(state),
  }),
  (dispatch) => ({
    onOpen: () => dispatch(openConsole('problems')),
    onClose: () => dispatch(setConsoleOpen(false)),
  }),
)(ProblemsBase);
