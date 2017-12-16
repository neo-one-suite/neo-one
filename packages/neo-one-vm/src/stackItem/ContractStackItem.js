/* @flow */
import type { Contract } from '@neo-one/core';

import ObjectStackItem from './ObjectStackItem';

export default class ContractStackItem extends ObjectStackItem<Contract> {
  asContract(): Contract {
    return this.value;
  }
}
