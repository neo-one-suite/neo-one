// tslint:disable no-null-keyword
import { Box, Tooltip, TooltipArrow } from '@neo-one/react-common';
import * as React from 'react';
import styled from 'styled-components';
import { TestPlayButton } from './TestPlayButton';
import { TestStatusBar } from './TestStatusBar';
import { TestFailing, TestPassing, TestTextDark } from './TestText';

const Wrapper = styled(Box)`
  display: grid;
  grid-gap: 0;
  align-content: center;
  justify-items: space-between;
  padding-top: 8px;
  padding-bottom: 8px;
  grid:
    'left right' auto
    'status status' auto
    / auto auto;
`;

const StyledGrid = styled(Box)`
  display: grid;
  grid-gap: 8px;
  grid-auto-flow: column;
  grid-auto-columns: auto;
`;

const LeftStyledGrid = styled(StyledGrid)`
  justify-content: start;
`;

const RightStyledGrid = styled(StyledGrid)`
  justify-content: end;
`;

const StyledTestStatusBar = styled(TestStatusBar)`
  grid-area: status;
`;

const StyledTestFailing = styled(TestFailing)`
  cursor: default;
`;

const StyledTestPassing = styled(TestPassing)`
  cursor: default;
`;

const StyledTestTextDark = styled(TestTextDark)`
  cursor: default;
`;

interface Props {
  readonly passing: number;
  readonly failing: number;
  readonly skipped: number;
  readonly total: number;
  readonly time: number;
  readonly runText: string;
  readonly onClickRun: () => void;
  readonly titleElement: React.ReactNode;
}

export const TestSummaryHeaderCommon = ({
  titleElement,
  passing,
  failing,
  skipped,
  total,
  time,
  runText,
  onClickRun,
  ...props
}: Props) => (
  <Wrapper {...props}>
    <LeftStyledGrid>
      {titleElement}
      {failing === 0 ? null : (
        <>
          <StyledTestFailing data-test="test-summary-header-failing">
            {failing}
            <Tooltip>
              <TooltipArrow />
              Failed
            </Tooltip>
          </StyledTestFailing>
          <TestTextDark>/</TestTextDark>
        </>
      )}
      {passing === 0 ? null : (
        <>
          <StyledTestPassing data-test="test-summary-header-passing">
            {passing}
            <Tooltip>
              <TooltipArrow />
              Passed
            </Tooltip>
          </StyledTestPassing>
          <TestTextDark>/</TestTextDark>
        </>
      )}
      <StyledTestTextDark data-test="test-summary-header-total">
        {total}
        <Tooltip>
          <TooltipArrow />
          Total
        </Tooltip>
      </StyledTestTextDark>
    </LeftStyledGrid>
    <RightStyledGrid>
      <TestTextDark data-test="test-summary-header-duration">{time} ms</TestTextDark>
      <TestPlayButton onClick={onClickRun} text={runText} />
    </RightStyledGrid>
    <StyledTestStatusBar passing={passing} failing={failing} skipped={skipped} />
  </Wrapper>
);
