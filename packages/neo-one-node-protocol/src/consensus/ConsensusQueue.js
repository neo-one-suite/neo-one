/* @flow */
import { AsyncIteratorBase } from '@neo-one/client-core';

import type { Event } from './types';

type Item =
  | {| type: 'value', value: Event |}
  | {| type: 'error', error: Error |};
type Resolver = {|
  resolve: (value: IteratorResult<Event, void>) => void,
  reject: (reason: Error) => void,
|};

export default class ConsensusQueue extends AsyncIteratorBase<
  Event,
  void,
  void,
> {
  _items: Array<Item>;
  _resolvers: Array<Resolver>;
  __done: boolean;

  constructor() {
    super();
    this._items = [];
    this._resolvers = [];
    this.__done = false;
  }

  next(): Promise<IteratorResult<Event, void>> {
    if (this._items.length > 0) {
      const item = this._items.shift();
      if (item.type === 'error') {
        return Promise.reject(item.error);
      }
      return Promise.resolve({ done: false, value: item.value });
    }

    if (this.__done) {
      return Promise.resolve({ done: true });
    }

    return new Promise((resolve, reject) => {
      this._resolvers.push({ resolve, reject });
    });
  }

  write(value: Event): void {
    this._push({ type: 'value', value });
  }

  error(error: Error): void {
    this._push({ type: 'error', error });
  }

  clear(): void {
    this._items = [];
  }

  done(): void {
    this.clear();
    this._resolvers.forEach(({ resolve }) => resolve({ done: true }));
    this._resolvers = [];
    this.__done = true;
  }

  _push(item: Item): void {
    if (this.__done) {
      throw new Error('ConsensusQueue already ended');
    }

    if (this._resolvers.length > 0) {
      const { resolve, reject } = this._resolvers.shift();
      if (item.type === 'error') {
        reject(item.error);
      } else {
        resolve({ done: false, value: item.value });
      }
    } else {
      this._items.push(item);
    }
  }
}
