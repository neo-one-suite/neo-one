import { common, UInt160 } from '@neo-one/client-common';
import { NativeContractStorageContext } from '@neo-one/node-core';
import { BN } from 'bn.js';
import { GASToken } from './GASToken';
import { NativeContract } from './NativeContract';
import { utils } from './utils';

// tslint:disable-next-line: export-name
export class PolicyContract extends NativeContract {
  private readonly prefixes = {
    maxTransactionsPerBlock: Buffer.from([23]),
    feePerByte: Buffer.from([10]),
    blockedAccounts: Buffer.from([15]),
    maxBlockSize: Buffer.from([12]),
    maxBlockSystemFee: Buffer.from([17]),
  };

  public constructor() {
    super({
      id: -3,
      name: 'Policy',
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
      return common.fixedFromDecimal(9000, GASToken.decimals).toNumber();
    }

    return new BN(item.value).toNumber();
  }

  public async getFeePerByte({ storages }: NativeContractStorageContext) {
    const item = await storages.tryGet(this.createStorageKey(this.prefixes.feePerByte).toStorageKey());
    if (item === undefined) {
      return 1000;
    }

    return new BN(item.value).toNumber();
  }

  public async getBlockedAccounts({ storages }: NativeContractStorageContext): Promise<readonly UInt160[]> {
    const item = await storages.tryGet(this.createStorageKey(this.prefixes.blockedAccounts).toStorageKey());
    if (item !== undefined) {
      return utils.getSerializableArrayFromStorageItem(item, (reader) => reader.readUInt160());
    }

    return [];
  }
}
