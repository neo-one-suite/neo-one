/* @flow */
import ArrayLikeStackItem from './ArrayLikeStackItem';

export default class StructStackItem extends ArrayLikeStackItem {
  clone(): StructStackItem {
    return new StructStackItem(
      this.value.map(
        value => (value instanceof StructStackItem ? value.clone() : value),
      ),
    );
  }
}
