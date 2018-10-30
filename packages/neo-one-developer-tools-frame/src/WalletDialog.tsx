import * as React from 'react';
import { Dialog, OverlayProps } from './Dialog';
import { WalletSelector } from './WalletSelector';
import { WalletTransfer } from './WalletTransfer';

interface Props {
  readonly children: (props: OverlayProps) => React.ReactNode;
}

export function WalletDialog({ children }: Props) {
  return (
    <Dialog
      data-test-heading="neo-one-wallet-dialog-heading"
      data-test-close-button="neo-one-wallet-dialog-close-button"
      title="Wallet"
      renderDialog={() => (
        <>
          <WalletSelector />
          <WalletTransfer />
        </>
      )}
    >
      {children}
    </Dialog>
  );
}
