import { common, UInt160 } from '@neo-one/client-common';
import { assertStructStackItem, StackItem } from '@neo-one/node-core';

export interface NFTStateAdd {
  readonly owner: UInt160;
  readonly name: string;
  readonly description: string;
}

export abstract class NFTState {
  public static fromStackItem(stackItem: StackItem): NFTStateAdd {
    const { array } = assertStructStackItem(stackItem);
    const owner = common.bufferToUInt160(array[0].getBuffer());
    const name = array[1].getString();
    const description = array[2].getString();

    return {
      owner,
      name,
      description,
    };
  }

  public abstract readonly id: Buffer;
  public readonly owner: UInt160;
  public readonly name: string;
  public readonly description: string;

  public constructor({ owner, name, description }: NFTStateAdd) {
    this.owner = owner;
    this.name = name;
    this.description = description;
  }
}
