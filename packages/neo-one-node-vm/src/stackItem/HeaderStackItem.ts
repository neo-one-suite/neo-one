import { BlockBase, Header } from '@neo-one/client-core';
import { ObjectStackItem } from './ObjectStackItem';

export class HeaderStackItem extends ObjectStackItem<Header> {
  public asHeader(): Header {
    return this.value;
  }

  public asBlockBase(): BlockBase {
    return this.value;
  }
}
