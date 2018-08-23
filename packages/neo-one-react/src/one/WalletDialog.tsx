import * as React from 'react';
import { Base } from 'reakit';
import { Dialog, OverlayProps } from './Dialog';
import { WalletSelector } from './WalletSelector';
import { WalletTransfer } from './WalletTransfer';

interface Props {
  readonly children: (props: OverlayProps) => React.ReactNode;
}

export function WalletDialog({ children }: Props) {
  return (
    <Dialog
      title="Wallet"
      renderDialog={() => (
        <Base>
          <WalletSelector />
          <WalletTransfer />
        </Base>
      )}
    >
      {children}
    </Dialog>
  );
}
