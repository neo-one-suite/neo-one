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
  <Wrapper onClick={onClick} {...props}>
    <GridWrapper>
      <MdError />
      {consoleProblems.filter((problem) => problem.severity === 'error').length}
      <MdWarning />
      {consoleProblems.filter((problem) => problem.severity === 'warning').length}
    </GridWrapper>
  </Wrapper>
);

export const Problems = connect(
  selectConsoleProblems,
  (dispatch) => ({
    onClick: () => dispatch(openConsole('problems')),
  }),
)(ProblemsBase);
