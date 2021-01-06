import { NativeContract } from './NativeContract';
import {
  NativeContractStorageContext,
  utils,
  StackItem,
  assertArrayStackItem,
  DesignationRole as Role,
} from '@neo-one/node-core';
import { map, toArray } from 'rxjs/operators';
import { ECPoint, common } from '@neo-one/client-common';

export class DesignationContract extends NativeContract {
  public constructor() {
    super({
      id: -5,
      name: 'DesignationContract',
    });
  }

  public async getDesignatedByRole(
    { storages }: NativeContractStorageContext,
    role: Role,
    height: number,
    index: number,
  ): Promise<readonly ECPoint[]> {
    if (height + 1 < index) {
      // TODO: implement makeError
      throw new Error(`index: ${index} out of range for getDesignatedByRole.`);
    }

    const key = this.createStorageKey(Buffer.from([role]))
      .addUInt32BE(index)
      .toSearchPrefix();
    const boundary = this.createStorageKey(Buffer.from([role])).toSearchPrefix();

    const range = await storages
      .find$(boundary, key)
      .pipe(
        map(({ value }) => utils.getInteroperable(value, NodeList.fromStackItem).members),
        toArray(),
      )
      .toPromise();

    const publicKeys = range.length === 0 ? undefined : range[range.length - 1];

    return publicKeys ?? [];
  }
}

class NodeList {
  public static fromStackItem(stackItem: StackItem): NodeList {
    const arrayItem = assertArrayStackItem(stackItem);
    const members = arrayItem.array.map((item) => common.bufferToECPoint(item.getBuffer()));

    return new NodeList(members);
  }

  public readonly members: readonly ECPoint[];

  public constructor(members: readonly ECPoint[]) {
    this.members = members;
  }
}
