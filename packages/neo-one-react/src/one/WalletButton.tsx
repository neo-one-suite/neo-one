import * as React from 'react';
import { MdAccountBalance } from 'react-icons/md';
import { Base, Overlay } from 'reakit';
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
            <Overlay.Show as={ToolbarButton} help="Open Wallet..." {...overlay}>
              <FromStream props$={client.accountState$}>
                {(value) => <Base>{value === undefined ? 'Select Wallet' : value.currentAccount.name}</Base>}
              </FromStream>
              <MdAccountBalance />
            </Overlay.Show>
          )}
        </DeveloperToolsContext.Consumer>
      )}
    </WalletDialog>
  );
}
