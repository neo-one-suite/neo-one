/* @flow */
import type LRU from 'lru-cache';
import {
  type ReadAllStorage,
  type ReadGetAllStorage,
  type ReadStorage,
} from '@neo-one/node-core';

type SerializeKeyString<Key> = (key: Key) => string;

export function createReadStorage<Key, Value>({
  cache,
  storage,
  serializeKeyString,
}: {|
  cache: LRU,
  storage: ReadStorage<Key, Value>,
  serializeKeyString: SerializeKeyString<Key>,
|}): ReadStorage<Key, Value> {
  const get = async (key: Key): Promise<Value> => {
    const keyString = serializeKeyString(key);
    const value = cache.get(keyString);
    if (value !== undefined) {
      return value;
    }

    return storage.get(key).then(val => {
      cache.set(keyString, val);
      return val;
    });
  };

  const tryGet = async (key: Key): Promise<?Value> => {
    const keyString = serializeKeyString(key);
    const value = cache.get(keyString);
    if (value !== undefined) {
      return value;
    }

    return storage.tryGet(key).then(val => {
      if (val != null) {
        cache.set(keyString, val);
      }
      return val;
    });
  };

  return { get, tryGet };
}

export function createReadAllStorage<Key, Value>({
  cache,
  storage,
  serializeKeyString,
}: {|
  cache: LRU,
  storage: ReadAllStorage<Key, Value>,
  serializeKeyString: SerializeKeyString<Key>,
|}): ReadAllStorage<Key, Value> {
  const readStorage = createReadStorage({
    cache,
    storage,
    serializeKeyString,
  });

  return {
    get: readStorage.get,
    tryGet: readStorage.tryGet,
    all: storage.all,
  };
}

export function createReadGetAllStorage<Key, Keys, Value>({
  cache,
  storage,
  serializeKeyString,
}: {|
  cache: LRU,
  storage: ReadGetAllStorage<Key, Keys, Value>,
  serializeKeyString: SerializeKeyString<Key>,
|}): ReadGetAllStorage<Key, Keys, Value> {
  const readStorage = createReadStorage({
    cache,
    storage,
    serializeKeyString,
  });

  return {
    get: readStorage.get,
    tryGet: readStorage.tryGet,
    getAll: storage.getAll,
  };
}
