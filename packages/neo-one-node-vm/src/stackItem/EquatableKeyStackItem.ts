import { EquatableKey } from '@neo-one/node-core';
import { ObjectStackItem } from './ObjectStackItem';

export class EquatableKeyStackItem<Value extends EquatableKey> extends ObjectStackItem<Value> {
  public toStructuralKey(): string {
    return this.value.toKeyString();
  }
  // tslint:disable-next-line no-any
  public equals(other: any): boolean {
    if (other === undefined) {
      return false;
    }

    if (this === other) {
      return true;
    }

    return other instanceof EquatableKeyStackItem && this.value.equals(other.value);
  }
}
