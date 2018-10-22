// tslint:disable no-null-keyword
import * as React from 'react';
import { MdClose, MdDeleteSweep } from 'react-icons/md';
import { connect } from 'react-redux';
import { css, Grid, styled } from 'reakit';
import {
  clearConsole,
  EditorState,
  selectConsoleErrorProblems,
  selectConsoleOutputOwner,
  selectConsoleType,
  selectConsoleWarningProblems,
  setConsoleOpen,
  setConsoleType,
} from '../redux';
import { ConsoleType } from '../types';
import { ConsoleButton } from './ConsoleButton';
import { ConsoleSelector } from './ConsoleSelector';
import { ConsoleTab } from './ConsoleTab';
import { ProblemCount } from './ProblemCount';

const Wrapper = styled(Grid)`
  justify-content: space-between;
  gap: 8px;
  grid:
    'tabs buttons' auto
    / auto auto;
`;

const TabsWrapper = styled(Grid)`
  padding-left: 8px;
  gap: 0;
  grid-auto-flow: column;
  align-items: center;
`;

const ButtonsWrapper = styled(Grid)`
  gap: 0;
  grid-auto-flow: column;
  align-items: center;
`;

const iconCSS = css`
  height: 16px;
  width: 16px;
`;

const Delete = styled(MdDeleteSweep)`
  ${iconCSS};
`;

const Close = styled(MdClose)`
  ${iconCSS};
`;

interface Props {
  readonly consoleType: ConsoleType;
  readonly consoleOutputOwner: string;
  readonly consoleErrorProblems: number;
  readonly consoleWarningProblems: number;
  readonly onClearConsole: (owner: string) => void;
  readonly onClickProblems: () => void;
  readonly onClickTests: () => void;
  readonly onClickOutput: () => void;
  readonly onCloseConsole: () => void;
}

const ConsoleHeaderBase = ({
  consoleType,
  consoleOutputOwner,
  consoleErrorProblems,
  consoleWarningProblems,
  onClickOutput,
  onClickProblems,
  onClickTests,
  onClearConsole,
  onCloseConsole,
  ...props
}: Props) => {
  const problemCount = consoleErrorProblems + consoleWarningProblems;

  return (
    <Wrapper {...props}>
      <TabsWrapper>
        <ConsoleTab selected={consoleType === 'problems'} onClick={onClickProblems} text="PROBLEMS">
          {problemCount === 0 ? null : (
            <ProblemCount data-test="console-header-problem-count">{problemCount}</ProblemCount>
          )}
        </ConsoleTab>
        <ConsoleTab selected={consoleType === 'output'} onClick={onClickOutput} text="OUTPUT" />
        <ConsoleTab selected={consoleType === 'test'} onClick={onClickTests} text="TESTS" />
      </TabsWrapper>
      <ButtonsWrapper>
        {consoleType === 'output' ? (
          <>
            <ConsoleSelector owner={consoleOutputOwner} />
            <ConsoleButton
              data-test="console-header-clear"
              icon={<Delete />}
              onClick={() => onClearConsole(consoleOutputOwner)}
              tooltip="Clear Output"
            />
          </>
        ) : null}
        <ConsoleButton icon={<Close />} onClick={onCloseConsole} tooltip="Close Panel" data-test="console-close" />
      </ButtonsWrapper>
    </Wrapper>
  );
};

export const ConsoleHeader = connect(
  (state: EditorState) => ({
    ...selectConsoleType(state),
    ...selectConsoleOutputOwner(state),
    ...selectConsoleErrorProblems(state),
    ...selectConsoleWarningProblems(state),
  }),
  (dispatch) => ({
    onClickProblems: () => dispatch(setConsoleType('problems')),
    onClickOutput: () => dispatch(setConsoleType('output')),
    onClickTests: () => dispatch(setConsoleType('test')),
    onClearConsole: (owner: string) => dispatch(clearConsole(owner)),
    onCloseConsole: () => dispatch(setConsoleOpen(false)),
  }),
)(ConsoleHeaderBase);
