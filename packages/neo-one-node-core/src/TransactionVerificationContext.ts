import { common, UInt160, UInt160Hex, UInt256Hex } from '@neo-one/client-common';
import { BN } from 'bn.js';
import { NativeContractStorageContext } from './Native';
import { isOracleResponse, Transaction } from './transaction';

const assertSender = (sender: UInt160 | undefined) => {
  if (sender === undefined) {
    throw new Error('Sender must be defined');
  }

  return sender;
};

export interface TransactionVerificationContextAdd {
  readonly getGasBalance: (storage: NativeContractStorageContext, sender: UInt160) => Promise<BN>;
}

export class TransactionVerificationContext {
  private readonly getGasBalance: (storage: NativeContractStorageContext, sender: UInt160) => Promise<BN>;
  private readonly mutableSenderFee: Record<UInt160Hex, BN | undefined>;
  private readonly mutableOracleResponses: Record<string, UInt256Hex | undefined>;

  public constructor({ getGasBalance }: TransactionVerificationContextAdd) {
    this.getGasBalance = getGasBalance;
    this.mutableSenderFee = {};
    this.mutableOracleResponses = {};
  }

  public addTransaction(tx: Transaction) {
    const oracle = tx.getAttribute(isOracleResponse);
    if (oracle !== undefined) {
      this.mutableOracleResponses[oracle.id.toString()] = tx.hashHex;
    }

    const key = common.uInt160ToHex(assertSender(tx.sender));
    const maybeFee = this.mutableSenderFee[key] ?? new BN(0);
    this.mutableSenderFee[key] = maybeFee.add(tx.systemFee).add(tx.networkFee);
  }

  public async checkTransaction(
    tx: Transaction,
    storage: NativeContractStorageContext,
  ): Promise<{ readonly result: boolean; readonly failureReason?: string }> {
    const sender = assertSender(tx.sender);
    const balance = await this.getGasBalance(storage, sender);
    const maybeFee = this.mutableSenderFee[common.uInt160ToHex(sender)] ?? new BN(0);
    const totalFee = maybeFee.add(tx.systemFee).add(tx.networkFee);

    if (balance.lt(totalFee)) {
      return {
        result: false,
        failureReason: `Insufficient balance for sender ${common.uInt160ToString(
          sender,
        )}. Sender balance: ${balance.toString()}. Total fee needed: ${totalFee.toString()}`,
      };
    }

    const oracle = tx.getAttribute(isOracleResponse);
    if (oracle !== undefined && this.mutableOracleResponses[oracle.id.toString()] !== undefined) {
      return {
        result: false,
        failureReason: `Expected oracle response to be undefined for id ${oracle.id.toString()}`,
      };
    }

    return { result: true };
  }

  public removeTransaction(tx: Transaction) {
    const sender = assertSender(tx.sender);
    const key = common.uInt160ToHex(sender);
    const maybeFee = this.mutableSenderFee[key];
    if (maybeFee === undefined) {
      throw new Error('Transaction not present in verification context to remove');
    }

    const newFee = maybeFee.sub(tx.systemFee).sub(tx.networkFee);
    if (newFee.eqn(0)) {
      // tslint:disable-next-line: no-dynamic-delete
      delete this.mutableSenderFee[key];
    } else {
      this.mutableSenderFee[key] = newFee;
    }

    const oracle = tx.getAttribute(isOracleResponse);
    if (oracle !== undefined) {
      // tslint:disable-next-line: no-dynamic-delete
      delete this.mutableOracleResponses[oracle.id.toString()];
    }
  }
}
