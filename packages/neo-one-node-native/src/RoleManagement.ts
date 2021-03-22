import { common, ECPoint } from '@neo-one/client-common';
import {
  assertArrayStackItem,
  BlockchainSettings,
  DesignationRole as Role,
  NativeContractStorageContext,
  RoleManagement as RoleManagementNode,
  StackItem,
  utils,
} from '@neo-one/node-core';
import { map, toArray } from 'rxjs/operators';
import { roleManagementMethods } from './methods';
import { NativeContract } from './NativeContract';

export class RoleManagement extends NativeContract implements RoleManagementNode {
  public constructor(settings: BlockchainSettings) {
    super({
      name: 'RoleManagement',
      id: -6,
      methods: roleManagementMethods,
      settings,
    });
  }

  /**
   * passing in height and index is a pretty HMMM way to do this but in the vein of being
   * consistent with C# code as much as possible we will do it like this. The reasoning
   * being that our snapshot equivalent 'storage' doesn't have knowledge of the current height,
   * that is a blockchain abstraction. In almost no situation should this first error actually throw.
   */
  public async getDesignatedByRole(
    { storages }: NativeContractStorageContext,
    role: Role,
    height: number,
    index: number,
  ): Promise<readonly ECPoint[]> {
    if (height + 1 < index) {
      throw new Error(`Index out of range for getDesignatedByRole: ${index}.`);
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
