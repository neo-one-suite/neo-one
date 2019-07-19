import styled from '@emotion/styled';
import { DispatchWrapper } from '@neo-one/react-common';
import * as React from 'react';
import { connect } from 'react-redux';
import { TestSuite } from '../../types';
import { EditorState, selectConsoleSelectedTestSuite, selectConsoleTestSuites } from '../redux';
import { TestDetail } from './TestDetail';
import { TestSummary } from './TestSummary';

const StyledGrid = styled(DispatchWrapper)`
  display: grid;
  grid:
    'summary detail' auto
    / minmax(auto, 420px) 5fr;
`;

interface Props {
  readonly consoleTestSuites: readonly TestSuite[];
  readonly consoleSelectedTestSuite?: string;
}

const TestViewBase = ({ consoleTestSuites, consoleSelectedTestSuite, ...props }: Props) => {
  const testSuite = consoleTestSuites.find((suite) => suite.path === consoleSelectedTestSuite);

  return (
    <StyledGrid {...props}>
      <TestSummary testSuites={consoleTestSuites} selectedTestSuite={consoleSelectedTestSuite} />
      {testSuite === undefined ? <div /> : <TestDetail testSuite={testSuite} />}
    </StyledGrid>
  );
};

export const TestView = connect((state: EditorState) => ({
  ...selectConsoleTestSuites(state),
  ...selectConsoleSelectedTestSuite(state),
}))(TestViewBase);
