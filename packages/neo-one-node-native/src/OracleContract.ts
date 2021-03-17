import { crypto } from '@neo-one/client-common';
import {
  assertArrayStackItem,
  BlockchainSettings,
  NativeContractStorageContext,
  OracleContract as OracleContractNode,
  OracleRequest,
  OracleRequestResults,
  StackItem,
  utils,
} from '@neo-one/node-core';
import { BN } from 'bn.js';
import { map, toArray } from 'rxjs/operators';
import { oracleMethods } from './methods';
import { NativeContract } from './NativeContract';

export class OracleContract extends NativeContract implements OracleContractNode {
  private readonly prefixes = {
    requestId: Buffer.from([9]),
    request: Buffer.from([7]),
    idList: Buffer.from([6]),
  };

  public constructor(settings: BlockchainSettings) {
    super({
      name: 'OracleContract',
      methods: oracleMethods,
      settings,
    });
  }

  public async getRequest({ storages }: NativeContractStorageContext, id: BN) {
    const item = await storages.tryGet(this.createStorageKey(this.prefixes.request).addUInt64BE(id).toStorageKey());

    if (item === undefined) {
      return undefined;
    }

    return utils.getInteroperable(item, OracleRequest.fromStackItem);
  }

  public async getRequests({ storages }: NativeContractStorageContext): Promise<OracleRequestResults> {
    return storages
      .find$(this.createStorageKey(this.prefixes.request).toSearchPrefix())
      .pipe(
        map(
          ({ key, value }) =>
            // tslint:disable-next-line: no-useless-cast
            [new BN(key.key.slice(1), 'be'), utils.getInteroperable(value, OracleRequest.fromStackItem)] as const,
        ),
        toArray(),
      )
      .toPromise();
  }

  public async getRequestsByUrl({ storages }: NativeContractStorageContext, url: string) {
    const maybeListItem = await storages.tryGet(
      this.createStorageKey(this.prefixes.idList).addBuffer(this.getUrlHash(url)).toStorageKey(),
    );
    if (maybeListItem === undefined) {
      return [];
    }

    const { list } = utils.getInteroperable(maybeListItem, IdList.fromStackItem);

    return Promise.all(
      list.map(async (id) => {
        const request = await storages.get(this.createStorageKey(this.prefixes.request).addUInt64BE(id).toStorageKey());

        return utils.getInteroperable(request, OracleRequest.fromStackItem);
      }),
    );
  }

  private getUrlHash(url: string) {
    return crypto.hash160(Buffer.from(url, 'utf8'));
  }
}

class IdList {
  public static fromStackItem(stackItem: StackItem): IdList {
    const { array } = assertArrayStackItem(stackItem);
    const list = array.map((item) => item.getInteger());

    return new IdList(list);
  }

  public readonly list: readonly BN[];

  public constructor(list: readonly BN[]) {
    this.list = list;
  }
}
