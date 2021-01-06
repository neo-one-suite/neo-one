import { crypto } from '@neo-one/client-common';
import { NativeContract } from './NativeContract';
import {
  NativeContractStorageContext,
  utils,
  StackItem,
  assertArrayStackItem,
  OracleRequestResults,
  OracleRequest,
} from '@neo-one/node-core';
import { BN } from 'bn.js';
import { map, toArray } from 'rxjs/operators';

export class OracleContract extends NativeContract {
  private readonly prefixes = {
    requestId: Buffer.from([9]),
    request: Buffer.from([7]),
    idList: Buffer.from([6]),
  };

  // applicationEngine constants that might be used later
  // private maxUrlLength = 256 as const;
  // private maxFilterLength = 128 as const;
  // private maxCallbackLength = 32 as const;
  // private maxUserDataLength = 512 as const;
  // private oracleRequestPrice = common.fixed8FromDecimal('.5');

  public constructor() {
    super({
      id: -4,
      name: 'OracleContract',
    });
  }

  public async getRequest({ storages }: NativeContractStorageContext, id: BN) {
    const item = await storages.tryGet(this.createStorageKey(this.prefixes.request).addUInt64LE(id).toStorageKey());

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
            [new BN(key.key.slice(1), 'le'), utils.getInteroperable(value, OracleRequest.fromStackItem)] as const,
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
        const request = await storages.get(this.createStorageKey(this.prefixes.request).addUInt64LE(id).toStorageKey());

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

  public list: readonly BN[];

  public constructor(list: readonly BN[]) {
    this.list = list;
  }
}
