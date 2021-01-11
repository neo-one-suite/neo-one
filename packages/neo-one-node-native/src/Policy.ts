import { common, UInt160 } from '@neo-one/client-common';
import { NativeContractStorageContext } from '@neo-one/node-core';
import { BN } from 'bn.js';
import { GASToken } from './GASToken';
import { NativeContract } from './NativeContract';

// tslint:disable-next-line: export-name
export class PolicyContract extends NativeContract {
  private readonly prefixes = {
    maxTransactionsPerBlock: Buffer.from([23]),
    feePerByte: Buffer.from([10]),
    blockedAccount: Buffer.from([15]),
    maxBlockSize: Buffer.from([12]),
    maxBlockSystemFee: Buffer.from([17]),
    execFeeFactor: Buffer.from([18]),
    storagePrice: Buffer.from([19]),
  };

  private readonly defaultExecFeeFactor = 30;
  private readonly defaultStoragePrice = 100000;

  public constructor() {
    super({
      id: -3,
      name: 'PolicyContract',
    });
  }

  public async getMaxTransactionsPerBlock({ storages }: NativeContractStorageContext) {
    const item = await storages.tryGet(this.createStorageKey(this.prefixes.maxTransactionsPerBlock).toStorageKey());
    if (item === undefined) {
      return 512;
    }

    return new BN(item.value).toNumber();
  }

  public async getMaxBlockSize({ storages }: NativeContractStorageContext) {
    const item = await storages.tryGet(this.createStorageKey(this.prefixes.maxBlockSize).toStorageKey());
    if (item === undefined) {
      return 1024 * 256;
    }

    return new BN(item.value).toNumber();
  }

  public async getMaxBlockSystemFee({ storages }: NativeContractStorageContext) {
    const item = await storages.tryGet(this.createStorageKey(this.prefixes.maxBlockSystemFee).toStorageKey());
    if (item === undefined) {
      return common.fixedFromDecimal(9000, GASToken.decimals);
    }

    return new BN(item.value);
  }

  public async getFeePerByte({ storages }: NativeContractStorageContext) {
    const item = await storages.tryGet(this.createStorageKey(this.prefixes.feePerByte).toStorageKey());
    if (item === undefined) {
      return new BN(1000);
    }

    return new BN(item.value);
  }

  public async getExecFeeFactor({ storages }: NativeContractStorageContext) {
    const item = await storages.tryGet(this.createStorageKey(this.prefixes.execFeeFactor).toStorageKey());
    if (item === undefined) {
      return this.defaultExecFeeFactor;
    }

    return new BN(item.value).toNumber();
  }

  public async getStoragePrice({ storages }: NativeContractStorageContext) {
    const item = await storages.tryGet(this.createStorageKey(this.prefixes.storagePrice).toStorageKey());
    if (item === undefined) {
      return this.defaultStoragePrice;
    }

    return new BN(item.value).toNumber();
  }

  public async isBlocked({ storages }: NativeContractStorageContext, account: UInt160) {
    const item = await storages.tryGet(
      this.createStorageKey(this.prefixes.blockedAccount).addBuffer(account).toStorageKey(),
    );

    return item !== undefined;
  }
}
