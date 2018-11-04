import { FromStream } from '@neo-one/react';
import { Fit, Tooltip, TooltipArrow } from '@neo-one/react-common';
import * as React from 'react';
import { Box, Input, styled } from 'reakit';
import { WithAutoConsensus } from './DeveloperToolsContext';
import { SettingsLabel } from './SettingsLabel';

const Wrapper = styled(Box)`
  position: relative;
`;

const StyledFit = styled(Fit)`
  cursor: pointer;
`;

export function AutoConsensusOption() {
  return (
    <WithAutoConsensus>
      {({ autoConsensus$, toggle }) => (
        <FromStream createStream={() => autoConsensus$} props={[autoConsensus$]}>
          {(autoConsensus) => (
            <Wrapper>
              <SettingsLabel data-test="neo-one-auto-consensus-container">
                Automatic Consensus
                <Input
                  data-test="neo-one-auto-consensus-checkbox"
                  type="checkbox"
                  checked={autoConsensus}
                  onChange={() => {
                    // do nothing
                  }}
                />
              </SettingsLabel>
              <StyledFit data-test="neo-one-auto-consensus-click" onClick={toggle}>
                <Tooltip data-test="neo-one-auto-consensus-tooltip" placement="right" delay="1s">
                  <TooltipArrow />
                  Automatically run consensus when a transaction is relayed.
                </Tooltip>
              </StyledFit>
            </Wrapper>
          )}
        </FromStream>
      )}
    </WithAutoConsensus>
  );
}
