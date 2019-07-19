import styled from '@emotion/styled';
import * as React from 'react';
import { MdError, MdWarning } from 'react-icons/md';
import { connect } from 'react-redux';
import {
  EditorState,
  openConsole,
  selectConsoleErrorProblems,
  selectConsoleOpen,
  selectConsoleType,
  selectConsoleWarningProblems,
  setConsoleOpen,
} from '../redux';
import { ConsoleType } from '../types';
import { Text } from './Text';
import { Wrapper } from './Wrapper';

const GridWrapper = styled(Text)`
  display: grid;
  gap: 2px;
  grid-auto-flow: column;
`;

interface Props {
  readonly consoleErrorProblems: number;
  readonly consoleWarningProblems: number;
  readonly consoleType: ConsoleType;
  readonly consoleOpen: boolean;
  readonly onOpen: () => void;
  readonly onClose: () => void;
}

const ProblemsBase = ({
  consoleErrorProblems,
  consoleWarningProblems,
  consoleType,
  consoleOpen,
  onOpen,
  onClose,
  ...props
}: Props) => (
  <Wrapper data-test="problems" onClick={consoleOpen && consoleType === 'problems' ? onClose : onOpen} {...props}>
    <GridWrapper>
      <MdError />
      <span data-test="problems-problem-count">{consoleErrorProblems}</span>
      <MdWarning />
      <span data-test="problems-warning-count">{consoleWarningProblems}</span>
    </GridWrapper>
  </Wrapper>
);

export const Problems = connect(
  (state: EditorState) => ({
    ...selectConsoleErrorProblems(state),
    ...selectConsoleWarningProblems(state),
    ...selectConsoleOpen(state),
    ...selectConsoleType(state),
  }),
  (dispatch) => ({
    onOpen: () => dispatch(openConsole('problems')),
    onClose: () => dispatch(setConsoleOpen(false)),
  }),
)(ProblemsBase);
