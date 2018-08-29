import { BlockBase, Header } from '@neo-one/client-core';
import { EquatableKeyStackItem } from './EquatableKeyStackItem';

export class HeaderStackItem extends EquatableKeyStackItem<Header> {
  public asHeader(): Header {
    return this.value;
  }

  public asBlockBase(): BlockBase {
    return this.value;
  }
}
