/* @flow */
import type { Block, BlockBase, Header } from '@neo-one/client-core';

import ObjectStackItem from './ObjectStackItem';

export default class BlockStackItem extends ObjectStackItem<Block> {
  asBlock(): Block {
    return this.value;
  }

  asHeader(): Header {
    return this.value.header;
  }

  asBlockBase(): BlockBase {
    return this.value;
  }
}
