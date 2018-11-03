import { FromStream } from '@neo-one/react-common';
import * as React from 'react';
import { MdAccountBalance } from 'react-icons/md';
import { Box, Overlay, styled } from 'reakit';
import { DeveloperToolsContext, DeveloperToolsContextType } from './DeveloperToolsContext';
import { ToolbarButton } from './ToolbarButton';
import { WalletDialog } from './WalletDialog';

const Text = styled(Box)`
  padding-right: 4px;
`;

export function WalletButton() {
  return (
    <WalletDialog>
      {(overlay) => (
        <DeveloperToolsContext.Consumer>
          {({ accountState$ }: DeveloperToolsContextType) => (
            <Overlay.Show
              data-test-button="neo-one-wallet-button"
              data-test-tooltip="neo-one-wallet-tooltip"
              as={ToolbarButton}
              help="Open Wallet..."
              {...overlay}
            >
              <FromStream props={[accountState$]} createStream={() => accountState$}>
                {(value) => (
                  <Text data-test="neo-one-wallet-value">
                    {value === undefined ? 'Select Wallet' : value.currentUserAccount.name}
                  </Text>
                )}
              </FromStream>
              <MdAccountBalance />
            </Overlay.Show>
          )}
        </DeveloperToolsContext.Consumer>
      )}
    </WalletDialog>
  );
}
