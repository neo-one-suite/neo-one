/* @flow */
import type { Output } from '@neo-one/client-core';

import ObjectStackItem from './ObjectStackItem';

export default class OutputStackItem extends ObjectStackItem<Output> {
  asOutput(): Output {
    return this.value;
  }
}
