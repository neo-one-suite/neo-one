import { UInt160 } from '@neo-one/client-common';
import { NativeContractStorageContext } from '@neo-one/node-core';
import { BN } from 'bn.js';
import { NativeContract, NativeContractAdd } from './NativeContract';

export interface NEP17NativeContractAdd extends NativeContractAdd {
  readonly symbol: string;
  readonly decimals: number;
}

export abstract class NEP17NativeContract extends NativeContract {
  public readonly symbol: string;
  public readonly decimals: number;
  public readonly factor: BN;

  protected readonly basePrefixes = {
    totalSupply: Buffer.from([11]),
    account: Buffer.from([20]),
  };

  public constructor(options: NEP17NativeContractAdd) {
    super(options);
    this.symbol = options.symbol;
    this.decimals = options.decimals;
    this.factor = new BN(10 ** this.decimals);
  }

  public async totalSupply({ storages }: NativeContractStorageContext): Promise<BN> {
    const storage = await storages.tryGet(this.createStorageKey(this.basePrefixes.totalSupply).toStorageKey());
    if (storage === undefined) {
      return new BN(0);
    }

    return new BN(storage.value);
  }

  public async balanceOf({ storages }: NativeContractStorageContext, account: UInt160): Promise<BN> {
    const storage = await storages.tryGet(
      this.createStorageKey(this.basePrefixes.account).addBuffer(account).toStorageKey(),
    );
    if (storage === undefined) {
      return new BN(0);
    }

    return new BN(storage.value);
  }
}
