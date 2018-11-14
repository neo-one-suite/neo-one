import { Witness } from '@neo-one/node-core';
import { EquatableKeyStackItem } from './EquatableKeyStackItem';

export class WitnessStackItem extends EquatableKeyStackItem<Witness> {
  public asWitness(): Witness {
    return this.value;
  }
}
