import * as React from 'react';
import { MdError, MdWarning } from 'react-icons/md';
import { connect } from 'react-redux';
import { as, Grid, styled } from 'reakit';
import { openConsole, selectConsoleProblems } from '../redux';
import { FileDiagnostic } from '../types';
import { Text } from './Text';
import { Wrapper } from './Wrapper';

const GridWrapper = styled(as(Text)(Grid))`
  gap: 2px;
  grid-auto-flow: column;
`;

interface Props {
  readonly consoleProblems: ReadonlyArray<FileDiagnostic>;
  readonly onClick: () => void;
}

const ProblemsBase = ({ consoleProblems, onClick, ...props }: Props) => (
  <Wrapper data-test="problems" onClick={onClick} {...props}>
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
  selectConsoleProblems,
  (dispatch) => ({
    onClick: () => dispatch(openConsole('problems')),
  }),
)(ProblemsBase);
