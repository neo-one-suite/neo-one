import { Asset } from '@neo-one/client-core';
import { EquatableKeyStackItem } from './EquatableKeyStackItem';

export class AssetStackItem extends EquatableKeyStackItem<Asset> {
  public asAsset(): Asset {
    return this.value;
  }
}
