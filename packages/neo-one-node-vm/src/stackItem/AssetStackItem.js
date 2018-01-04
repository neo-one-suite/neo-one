/* @flow */
import type { Asset } from '@neo-one/client-core';

import ObjectStackItem from './ObjectStackItem';

export default class AssetStackItem extends ObjectStackItem<Asset> {
  asAsset(): Asset {
    return this.value;
  }
}
