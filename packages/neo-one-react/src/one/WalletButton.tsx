import * as React from 'react';
import { MdAccountBalance } from 'react-icons/md';
import { Box, Overlay } from 'reakit';
import { FromStream } from '../FromStream';
import { DeveloperToolsContext } from './DeveloperToolsContext';
import { ToolbarButton } from './ToolbarButton';
import { WalletDialog } from './WalletDialog';

export function WalletButton() {
  return (
    <WalletDialog>
      {(overlay) => (
        <DeveloperToolsContext.Consumer>
          {({ client }) => (
            <Overlay.Show
              data-test-button="neo-one-wallet-button"
              data-test-tooltip="neo-one-wallet-tooltip"
              as={ToolbarButton}
              help="Open Wallet..."
              {...overlay}
            >
              <FromStream props$={client.accountState$}>
                {(value) => (
                  <Box data-test="neo-one-wallet-value">
                    {value === undefined ? 'Select Wallet' : value.currentAccount.name}
                  </Box>
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
