// tslint:disable no-null-keyword
import { Tooltip, TooltipArrow } from '@neo-one/react';
import * as React from 'react';
import { Grid, styled } from 'reakit';
import { TestPlayButton } from './TestPlayButton';
import { TestStatusBar } from './TestStatusBar';
import { TestFailing, TestPassing, TestTextDark } from './TestText';

const Wrapper = styled(Grid)`
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

const StyledGrid = styled(Grid)`
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
          <StyledTestFailing>
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
          <StyledTestPassing>
            {passing}
            <Tooltip>
              <TooltipArrow />
              Passed
            </Tooltip>
          </StyledTestPassing>
          <TestTextDark>/</TestTextDark>
        </>
      )}
      <StyledTestTextDark>
        {total}
        <Tooltip>
          <TooltipArrow />
          Total
        </Tooltip>
      </StyledTestTextDark>
    </LeftStyledGrid>
    <RightStyledGrid>
      <TestTextDark>{time} ms</TestTextDark>
      <TestPlayButton onClick={onClickRun} text={runText} />
    </RightStyledGrid>
    <StyledTestStatusBar passing={passing} failing={failing} skipped={skipped} />
  </Wrapper>
);
