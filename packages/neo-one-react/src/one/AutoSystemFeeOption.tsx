import { Fit, FromStream, Tooltip, TooltipArrow } from '@neo-one/react-common';
import * as React from 'react';
import { Box, Input, styled } from 'reakit';
import { WithAutoSystemFee } from './DeveloperToolsContext';
import { SettingsLabel } from './SettingsLabel';

const Wrapper = styled(Box)`
  position: relative;
`;

const StyledFit = styled(Fit)`
  cursor: pointer;
`;

export function AutoSystemFeeOption() {
  return (
    <WithAutoSystemFee>
      {({ autoSystemFee$, toggle }) => (
        <FromStream createStream={() => autoSystemFee$} props={[autoSystemFee$]}>
          {(autoSystemFee) => (
            <Wrapper>
              <SettingsLabel data-test="neo-one-auto-system-fee-container">
                Automatic System Fee
                <Input
                  data-test="neo-one-auto-system-fee-checkbox"
                  type="checkbox"
                  checked={autoSystemFee}
                  onChange={() => {
                    // do nothing
                  }}
                />
              </SettingsLabel>
              <StyledFit data-test="neo-one-auto-system-fee-click" onClick={toggle}>
                <Tooltip data-test="neo-one-auto-system-fee-tooltip" placement="right" delay="1s">
                  <TooltipArrow />
                  Automatically execute all transactions with the required system fee.
                </Tooltip>
              </StyledFit>
            </Wrapper>
          )}
        </FromStream>
      )}
    </WithAutoSystemFee>
  );
}
