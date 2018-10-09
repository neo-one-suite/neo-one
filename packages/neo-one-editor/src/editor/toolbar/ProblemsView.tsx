// tslint:disable no-any
// @ts-ignore
import Scrollable from '@render-props/scrollable';
import _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import { styled } from 'reakit';
import { ifProp } from 'styled-tools';
import { selectConsoleProblems } from '../redux';
import { FileDiagnostic, TextRange } from '../types';
import { ProblemView } from './ProblemView';

const Wrapper = styled.div<{ readonly shadowed: boolean }>`
  display: grid;
  align-content: start;
  width: 100%;
  overflow-y: scroll;
  ${ifProp('shadowed', 'box-shadow: inset 0 10px 10px -5px rgba(0, 0, 0, 0.25)')};
`;

interface Props {
  readonly consoleProblems: ReadonlyArray<FileDiagnostic>;
  readonly onSelectRange: (path: string, range: TextRange) => void;
}

const ProblemsViewBase = ({ consoleProblems: problemsIn, onSelectRange, ...props }: Props) => {
  const groupedProblems = _.groupBy(problemsIn, (problem) => problem.path);

  return (
    <Scrollable>
      {({ scrollRef, scrollY }: any) => (
        <Wrapper innerRef={scrollRef} shadowed={scrollY > 0} {...props}>
          {Object.entries(groupedProblems).map(([path, problems]) => (
            <ProblemView key={path} path={path} problems={problems} onSelectRange={onSelectRange} />
          ))}
        </Wrapper>
      )}
    </Scrollable>
  );
};

export const ProblemsView = connect(selectConsoleProblems)(ProblemsViewBase);
