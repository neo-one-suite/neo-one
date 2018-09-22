import { Asset } from '@neo-one/node-core';
import { EquatableKeyStackItem } from './EquatableKeyStackItem';

export class AssetStackItem extends EquatableKeyStackItem<Asset> {
  public asAsset(): Asset {
    return this.value;
  }
}
