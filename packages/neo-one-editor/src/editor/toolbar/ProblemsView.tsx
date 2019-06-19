// tslint:disable no-any
import { Box, styledOmitProps } from '@neo-one/react-common';
// @ts-ignore
import Scrollable from '@render-props/scrollable';
import _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import { ifProp } from 'styled-tools';
import { FileProblems, selectConsoleProblems } from '../redux';
import { TextRange } from '../types';
import { ProblemView } from './ProblemView';

const Wrapper = styledOmitProps<{ readonly shadowed: boolean }>(Box, ['shadowed'])`
  display: grid;
  align-content: start;
  width: 100%;
  overflow-y: auto;
  ${ifProp('shadowed', 'box-shadow: inset 0 10px 10px -5px rgba(0, 0, 0, 0.25)')};
`;

interface Props {
  readonly consoleProblems: FileProblems;
  readonly onSelectRange: (path: string, range: TextRange) => void;
}

const ProblemsViewBase = ({ consoleProblems, onSelectRange, ...props }: Props) => {
  const groupedProblems = _.sortBy(Object.entries(consoleProblems), [([path]) => path]).filter(
    (value) => value[1].length > 0,
  );

  return (
    <Scrollable>
      {({ scrollRef, scrollY }: any) => (
        <Wrapper ref={scrollRef} shadowed={scrollY > 0} {...props}>
          {groupedProblems.map(([path, problems]) => (
            <ProblemView
              key={path}
              path={path}
              problems={_.sortBy(problems, [(problem) => problem.startLineNumber])}
              onSelectRange={onSelectRange}
            />
          ))}
        </Wrapper>
      )}
    </Scrollable>
  );
};

export const ProblemsView = connect(selectConsoleProblems)(ProblemsViewBase);
