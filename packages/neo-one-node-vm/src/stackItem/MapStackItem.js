/* @flow */
import {
  type ContractParameter,
  InteropInterfaceContractParameter,
} from '@neo-one/client-core';

import { utils } from '@neo-one/utils';

import ArrayStackItem from './ArrayStackItem';
import { InvalidValueBufferError } from './errors';
import StackItemBase from './StackItemBase';
import type { StackItem } from './StackItem';

type MapKeys = { [key: string]: StackItem };
type MapValues = { [key: string]: StackItem };
export default class MapStackItem extends StackItemBase {
  _keys: MapKeys;
  _values: MapValues;

  constructor(options?: {| keys: MapKeys, values: MapValues |}) {
    super();
    const { keys, values } = options || {};
    this._keys = keys || {};
    this._values = values || {};
  }

  equals(other: mixed): boolean {
    if (other == null) {
      return false;
    }

    return this === other;
  }

  asBoolean(): boolean {
    return true;
  }

  asBuffer(): Buffer {
    throw new InvalidValueBufferError();
  }

  toContractParameter(): ContractParameter {
    return new InteropInterfaceContractParameter();
  }

  get size(): number {
    return Object.keys(this._values).length;
  }

  has(item: StackItem): boolean {
    const key = item.toKeyString();
    return this._keys[key] != null;
  }

  get(item: StackItem): StackItem {
    const key = item.toKeyString();
    return this._values[key];
  }

  set(key: StackItem, value: StackItem): this {
    const keyValue = key.toKeyString();
    this._keys[keyValue] = key;
    this._values[keyValue] = value;
    return this;
  }

  delete(item: StackItem): this {
    const key = item.toKeyString();
    delete this._keys[key];
    delete this._values[key];
    return this;
  }

  keys(): ArrayStackItem {
    return new ArrayStackItem(utils.values(this._keys));
  }

  valuesArray(): Array<StackItem> {
    return utils.values(this._values);
  }

  asMapStackItem(): MapStackItem {
    return this;
  }
}
