import { StackItemType } from '@neo-one/client-common';
import { ContractParameter, MapContractParameter } from '../contractParameter';
import { CircularReferenceError } from './errors';
import { StackItemBase } from './StackItemBase';
import { PrimitiveStackItem, StackItem } from './StackItems';

export class MapStackItem extends StackItemBase {
  public static readonly maxKeySize = 64;

  public readonly dictionary: Map<PrimitiveStackItem, StackItem>;

  public constructor(dictionary: Map<PrimitiveStackItem, StackItem>) {
    super({
      type: StackItemType.Map,
      isNull: false,
    });

    this.dictionary = dictionary;
  }

  public get count() {
    return this.dictionary.size;
  }

  public get subItemCount() {
    return this.count * 2;
  }

  public containsKey(key: PrimitiveStackItem) {
    return this.dictionary.has(key);
  }

  public tryGetValue(key: PrimitiveStackItem) {
    return this.dictionary.get(key);
  }

  public getBoolean() {
    return true;
  }

  public toContractParameter(seen: Set<StackItemBase> = new Set()): ContractParameter {
    if (seen.has(this)) {
      throw new CircularReferenceError();
    }
    const newSeen = new Set([...seen]);
    newSeen.add(this);

    return new MapContractParameter(
      [...this.dictionary.keys()].map<readonly [ContractParameter, ContractParameter]>((key) => [
        key.toContractParameter(newSeen),
        (this.dictionary.get(key) as StackItem).toContractParameter(newSeen),
      ]),
    );
  }
}
