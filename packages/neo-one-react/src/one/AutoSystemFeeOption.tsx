import * as React from 'react';
import { Block, Fit, Input, Label, styled } from 'reakit';
import { FromStream } from '../FromStream';
import { WithAutoSystemFee } from './DeveloperToolsContext';
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

export function AutoSystemFeeOption() {
  return (
    <WithAutoSystemFee>
      {({ autoSystemFee$, toggle }) => (
        <FromStream props$={autoSystemFee$}>
          {(autoSystemFee) => (
            <Block relative>
              <Wrapper data-test="neo-one-auto-system-fee-container">
                Automatic System Fee
                <Input
                  data-test="neo-one-auto-system-fee-checkbox"
                  type="checkbox"
                  checked={autoSystemFee}
                  onChange={() => {
                    // do nothing
                  }}
                />
                <Tooltip data-test="neo-one-auto-system-fee-tooltip" placement="right">
                  <TooltipArrow />
                  Automatically execute all transactions with the required system fee.
                </Tooltip>
              </Wrapper>
              <StyledFit data-test="neo-one-auto-system-fee-click" onClick={toggle} />
            </Block>
          )}
        </FromStream>
      )}
    </WithAutoSystemFee>
  );
}
