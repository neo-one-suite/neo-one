/* @flow */
import { STACK_ITEM_TYPE } from './StackItemType';
import ArrayLikeStackItem from './ArrayLikeStackItem';

export default class ArrayStackItem extends ArrayLikeStackItem {
  static type = STACK_ITEM_TYPE.ARRAY;
}
