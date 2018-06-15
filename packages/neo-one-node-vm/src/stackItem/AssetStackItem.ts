import { Asset } from '@neo-one/client-core';
import { ObjectStackItem } from './ObjectStackItem';

export class AssetStackItem extends ObjectStackItem<Asset> {
  public asAsset(): Asset {
    return this.value;
  }
}
