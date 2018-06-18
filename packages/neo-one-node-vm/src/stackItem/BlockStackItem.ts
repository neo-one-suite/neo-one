import { Block, BlockBase, Header } from '@neo-one/client-core';
import { ObjectStackItem } from './ObjectStackItem';

export class BlockStackItem extends ObjectStackItem<Block> {
  public asBlock(): Block {
    return this.value;
  }

  public asHeader(): Header {
    return this.value.header;
  }

  public asBlockBase(): BlockBase {
    return this.value;
  }
}
