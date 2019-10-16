import { StorageItem } from '@neo-one/node-core';
import { BN } from 'bn.js';

export class Nep5AccountState {
  public mutableBalance: BN;

  public constructor(data: StorageItem | undefined) {
    this.mutableBalance = data === undefined ? new BN(0) : new BN(data.value);
  }

  public updateBalance(amount: BN) {
    this.mutableBalance = this.mutableBalance.add(amount);
  }
}
