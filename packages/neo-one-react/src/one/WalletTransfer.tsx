import * as React from 'react';
import { TransferAmount } from './TransferAmount';
import { TransferTo } from './TransferTo';

export function WalletTransfer() {
  return (
    <>
      <TransferTo />
      <TransferAmount />
    </>
  );
}
