import { common, UInt160, UInt160Hex } from '@neo-one/client-common';
import { NativeContractStorageContext, Transaction } from '@neo-one/node-core';
import { BN } from 'bn.js';

const assertSender = (sender: UInt160 | undefined) => {
  if (sender === undefined) {
    // TODO: implement error;
    throw new Error(`Sender must be defined`);
  }

  return sender;
};

export interface TransactionVerificationContextAdd {
  readonly getGasBalance: (storage: NativeContractStorageContext, sender: UInt160) => Promise<BN>;
}

export class TransactionVerificationContext {
  private readonly getGasBalance: (storage: NativeContractStorageContext, sender: UInt160) => Promise<BN>;
  private readonly mutableSenderFee: Record<UInt160Hex, BN | undefined>;

  public constructor({ getGasBalance }: TransactionVerificationContextAdd) {
    this.getGasBalance = getGasBalance;
    this.mutableSenderFee = {};
  }

  public addTransaction(tx: Transaction) {
    const key = common.uInt160ToHex(assertSender(tx.sender));
    const maybeFee = this.mutableSenderFee[key] ?? new BN(0);
    this.mutableSenderFee[key] = maybeFee.add(tx.systemFee).add(tx.networkFee);
  }

  public async checkTransaction(tx: Transaction, storage: NativeContractStorageContext): Promise<boolean> {
    const sender = assertSender(tx.sender);
    const balance = await this.getGasBalance(storage, sender);
    const maybeFee = this.mutableSenderFee[common.uInt160ToHex(sender)] ?? new BN(0);
    const totalFee = maybeFee.add(tx.systemFee).add(tx.networkFee);

    return balance.gte(totalFee);
  }

  public removeTransaction(tx: Transaction) {
    const sender = assertSender(tx.sender);
    const key = common.uInt160ToHex(sender);
    const maybeFee = this.mutableSenderFee[key];
    if (maybeFee === undefined) {
      // TODO: implement error;
      throw new Error('transaction not present in verification context to remove');
    }

    const newFee = maybeFee.sub(tx.systemFee).sub(tx.networkFee);
    if (newFee.eqn(0)) {
      // tslint:disable-next-line: no-dynamic-delete
      delete this.mutableSenderFee[key];
    } else {
      this.mutableSenderFee[key] = newFee;
    }
  }
}
