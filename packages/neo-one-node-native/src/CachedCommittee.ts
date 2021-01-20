import { common, ECPoint } from '@neo-one/client-common';
import { assertArrayStackItem, assertStructStackItem, StackItem } from '@neo-one/node-core';
import { BN } from 'bn.js';

interface CachedCommitteeElement {
  readonly publicKey: ECPoint;
  readonly votes: BN;
}

export class CachedCommittee {
  public static fromStackItem(item: StackItem) {
    const arrayItem = assertArrayStackItem(item);

    const members = arrayItem.array.map((element) => {
      const structItem = assertStructStackItem(element);

      return {
        publicKey: common.bufferToECPoint(structItem.array[0].getBuffer()),
        votes: structItem.array[1].getInteger(),
      };
    });

    return new CachedCommittee(members);
  }

  public readonly members: readonly CachedCommitteeElement[];

  public constructor(members: readonly CachedCommitteeElement[]) {
    this.members = members;
  }
}
