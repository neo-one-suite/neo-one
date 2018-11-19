import { Box } from '@neo-one/react-common';
import * as React from 'react';
import styled from 'styled-components';
import { TestSuite } from '../../types';
import { TestDetailHeader } from './TestDetailHeader';
import { TestDetailList } from './TestDetailList';

const Wrapper = styled(Box)`
  display: grid;
  grid-gap: 8px;
  grid-auto-flow: row;
  grid-auto-rows: auto;
  align-content: start;
  padding-left: 8px;
  padding-right: 8px;
  padding-bottom: 8px;
  min-height: 0;
`;

interface Props {
  readonly testSuite: TestSuite;
}

export const TestDetail = ({ testSuite, ...props }: Props) => (
  <Wrapper {...props}>
    <TestDetailHeader testSuite={testSuite} />
    <TestDetailList testSuite={testSuite} />
  </Wrapper>
);
