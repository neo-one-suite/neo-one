/* @flow */
import { STACK_ITEM_TYPE } from './StackItemType';

import ArrayLikeStackItem from './ArrayLikeStackItem';

export default class StructStackItem extends ArrayLikeStackItem {
  static type = STACK_ITEM_TYPE.STRUCT;

  clone(): StructStackItem {
    return new StructStackItem(
      this.value.map(
        value => (value instanceof StructStackItem ? value.clone() : value),
      ),
    );
  }
}
