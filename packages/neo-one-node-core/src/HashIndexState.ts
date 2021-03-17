import { common, UInt256 } from '@neo-one/client-common';
import { assertStructStackItem, StackItem } from './StackItems';

export interface HashIndexStateAdd {
  readonly hash: UInt256;
  readonly index: number;
}

export class HashIndexState {
  public static fromStackItem(stackItem: StackItem) {
    const { array } = assertStructStackItem(stackItem);
    const hash = common.bufferToUInt256(array[0].getBuffer());
    const index = array[1].getInteger().toNumber();

    return new HashIndexState({
      hash,
      index,
    });
  }

  public readonly hash: UInt256;
  public readonly index: number;
  public constructor({ hash, index }: HashIndexStateAdd) {
    this.hash = hash;
    this.index = index;
  }
}
