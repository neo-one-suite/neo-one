import styled from '@emotion/styled';
import { Box, Fit, Input, Tooltip, TooltipArrow } from '@neo-one/react-common';
import * as React from 'react';
import { useAutoConsensus } from './DeveloperToolsContext';
import { SettingsLabel } from './SettingsLabel';

const Wrapper = styled(Box)`
  position: relative;
`;

const StyledFit = styled(Fit)`
  cursor: pointer;
`;

export function AutoConsensusOption() {
  const [autoConsensus, toggle] = useAutoConsensus();

  return (
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
  );
}
