import { common, ECPoint } from '@neo-one/client-common';
import {
  assertArrayStackItem,
  BlockchainSettings,
  DesignationRole as Role,
  LedgerContract,
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
      id: -8,
      methods: roleManagementMethods,
      events: [
        {
          name: 'Designation',
          parameters: [
            {
              name: 'Role',
              type: 'Integer',
            },
            {
              name: 'BlockIndex',
              type: 'Integer',
            },
          ],
        },
      ],
      settings,
    });
  }

  public async getDesignatedByRole(
    storage: NativeContractStorageContext,
    role: Role,
    ledger: LedgerContract,
    index: number,
  ): Promise<readonly ECPoint[]> {
    const { storages } = storage;
    if ((await ledger.currentIndex(storage)) + 1 < index) {
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
