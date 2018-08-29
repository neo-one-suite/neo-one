import { Block, BlockBase, Header } from '@neo-one/client-core';
import { EquatableKeyStackItem } from './EquatableKeyStackItem';

export class BlockStackItem extends EquatableKeyStackItem<Block> {
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
