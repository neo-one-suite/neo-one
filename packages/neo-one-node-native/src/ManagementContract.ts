import { UInt160 } from '@neo-one/client-common';
import { ContractState, NativeContractStorageContext, utils } from '@neo-one/node-core';
import { map, toArray } from 'rxjs/operators';
import { NativeContract } from './NativeContract';

export class ManagementContract extends NativeContract {
  private readonly prefixes = {
    minimumDeploymentFee: Buffer.from([20]),
    nextAvailableId: Buffer.from([15]),
    contract: Buffer.from([8]),
  };

  public constructor() {
    super({
      id: 0,
      name: 'ManagementContract',
    });
  }

  public async getContract({ storages }: NativeContractStorageContext, hash: UInt160) {
    const maybeContract = await storages.tryGet(
      this.createStorageKey(this.prefixes.contract).addBuffer(hash).toStorageKey(),
    );

    if (maybeContract === undefined) {
      return undefined;
    }

    return utils.getInteroperable(maybeContract, ContractState.fromStackItem);
  }

  public async listContracts({ storages }: NativeContractStorageContext) {
    const searchPrefix = this.createStorageKey(this.prefixes.contract).toSearchPrefix();

    return storages
      .find$(searchPrefix)
      .pipe(
        map(({ value }) => utils.getInteroperable(value, ContractState.fromStackItem)),
        toArray(),
      )
      .toPromise();
  }
}
