import { Box } from '@neo-one/react-common';
import * as React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { TestSuite } from '../../types';
import { EditorState, selectConsoleSelectedTestSuite, selectConsoleTestSuites } from '../redux';
import { TestDetail } from './TestDetail';
import { TestSummary } from './TestSummary';

const StyledGrid = styled(Box)`
  display: grid;
  grid:
    'summary detail' auto
    / minmax(auto, 420px) 5fr;
`;

interface Props {
  readonly consoleTestSuites: ReadonlyArray<TestSuite>;
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
