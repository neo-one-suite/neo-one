import * as React from 'react';
import { Block, Input, Label, styled } from 'reakit';
import { FromStream } from '../FromStream';
import { WithAutoConsensus } from './DeveloperToolsContext';
import { Fit } from './Fit';
import { Tooltip, TooltipArrow } from './Tooltip';

const Wrapper = styled(Label)`
  align-items: center;
  display: flex;
  font: inherit;
  justify-content: space-between;
  line-height: inherit;
  cursor: pointer;
`;

const StyledFit = styled(Fit)`
  cursor: pointer;
`;

export function AutoConsensusOption() {
  return (
    <WithAutoConsensus>
      {({ autoConsensus$, toggle }) => (
        <FromStream props$={autoConsensus$}>
          {(autoConsensus) => (
            <Block relative>
              <Wrapper data-test="neo-one-auto-consensus-container">
                Automatic Consensus
                <Input
                  data-test="neo-one-auto-consensus-checkbox"
                  type="checkbox"
                  checked={autoConsensus}
                  onChange={() => {
                    // do nothing
                  }}
                />
                <Tooltip data-test="neo-one-auto-consensus-tooltip" placement="right">
                  <TooltipArrow />
                  Automatically run consensus when a transaction is relayed.
                </Tooltip>
              </Wrapper>
              <StyledFit data-test="neo-one-auto-consensus-click" onClick={toggle} />
            </Block>
          )}
        </FromStream>
      )}
    </WithAutoConsensus>
  );
}
