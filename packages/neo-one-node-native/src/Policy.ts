import { UInt160 } from '@neo-one/client-common';
import {
  BlockchainSettings,
  NativeContractStorageContext,
  PolicyContract as PolicyContractNode,
} from '@neo-one/node-core';
import { BN } from 'bn.js';
import { policyMethods } from './methods';
import { NativeContract } from './NativeContract';

// tslint:disable-next-line: export-name
export class PolicyContract extends NativeContract implements PolicyContractNode {
  private readonly prefixes = {
    maxTransactionsPerBlock: Buffer.from([23]),
    feePerByte: Buffer.from([10]),
    blockedAccount: Buffer.from([15]),
    maxBlockSize: Buffer.from([12]),
    maxBlockSystemFee: Buffer.from([17]),
    execFeeFactor: Buffer.from([18]),
    storagePrice: Buffer.from([19]),
  };

  public constructor(settings: BlockchainSettings) {
    super({
      name: 'PolicyContract',
      id: -5,
      methods: policyMethods,
      settings,
    });
  }

  public async getMaxTransactionsPerBlock({ storages }: NativeContractStorageContext) {
    const item = await storages.get(this.createStorageKey(this.prefixes.maxTransactionsPerBlock).toStorageKey());

    return new BN(item.value).toNumber();
  }

  public async getMaxBlockSize({ storages }: NativeContractStorageContext) {
    const item = await storages.get(this.createStorageKey(this.prefixes.maxBlockSize).toStorageKey());

    return new BN(item.value).toNumber();
  }

  public async getMaxBlockSystemFee({ storages }: NativeContractStorageContext) {
    const item = await storages.get(this.createStorageKey(this.prefixes.maxBlockSystemFee).toStorageKey());

    return new BN(item.value);
  }

  public async getFeePerByte({ storages }: NativeContractStorageContext) {
    const item = await storages.get(this.createStorageKey(this.prefixes.feePerByte).toStorageKey());

    return new BN(item.value);
  }

  public async getExecFeeFactor({ storages }: NativeContractStorageContext) {
    const item = await storages.get(this.createStorageKey(this.prefixes.execFeeFactor).toStorageKey());

    return new BN(item.value).toNumber();
  }

  public async getStoragePrice({ storages }: NativeContractStorageContext) {
    const item = await storages.get(this.createStorageKey(this.prefixes.storagePrice).toStorageKey());

    return new BN(item.value).toNumber();
  }

  public async isBlocked({ storages }: NativeContractStorageContext, account: UInt160) {
    const item = await storages.tryGet(
      this.createStorageKey(this.prefixes.blockedAccount).addBuffer(account).toStorageKey(),
    );

    return item !== undefined;
  }
}
