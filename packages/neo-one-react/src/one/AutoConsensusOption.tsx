import * as React from 'react';
import { Input, Label, styled } from 'reakit';
import { WithAutoConsensus } from './DeveloperToolsContext';
import { Tooltip, TooltipArrow } from './Tooltip';

const Wrapper = styled(Label)`
  align-items: center;
  display: flex;
  font: inherit;
  justify-content: space-between;
  line-height: inherit;
`;

export function AutoConsensusOption() {
  return (
    <WithAutoConsensus>
      {({ autoConsensus, toggle }) => (
        <Wrapper>
          Automatic Consensus
          <Input type="checkbox" value={autoConsensus} onChange={toggle} />
          <Tooltip placement="top">
            <TooltipArrow />
            Automatically run consensus when a transaction is relayed.
          </Tooltip>
        </Wrapper>
      )}
    </WithAutoConsensus>
  );
}
