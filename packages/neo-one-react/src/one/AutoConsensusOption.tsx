import * as React from 'react';
import { Input, Label, styled } from 'reakit';
import { FromStream } from '../FromStream';
import { WithAutoConsensus } from './DeveloperToolsContext';
import { Tooltip, TooltipArrow } from './Tooltip';

const Wrapper = styled(Label)`
  align-items: center;
  display: flex;
  font: inherit;
  justify-content: space-between;
  line-height: inherit;
  cursor: pointer;
`;

export function AutoConsensusOption() {
  return (
    <WithAutoConsensus>
      {({ autoConsensus$, toggle }) => (
        <FromStream props$={autoConsensus$}>
          {(autoConsensus) => (
            <Wrapper data-test="neo-one-auto-consensus-container" onClick={toggle}>
              Automatic Consensus
              <Input
                data-test="neo-one-auto-consensus-checkbox"
                type="checkbox"
                checked={autoConsensus}
                onChange={toggle}
              />
              <Tooltip data-test="neo-one-auto-consensus-tooltip" placement="right">
                <TooltipArrow />
                Automatically run consensus when a transaction is relayed.
              </Tooltip>
            </Wrapper>
          )}
        </FromStream>
      )}
    </WithAutoConsensus>
  );
}
