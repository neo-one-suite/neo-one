// tslint:disable no-var-before-return prefer-immediate-return
import { ReadAllStorage, ReadGetAllStorage, ReadMetadataStorage, ReadStorage } from '@neo-one/node-core';
import { LevelUp } from 'levelup';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { KeyNotFoundError } from './errors';
import { streamToObservable } from './streamToObservable';

type SerializeKey<Key> = (key: Key) => string;

export function createTryGet<Key, Value>({
  get,
}: {
  readonly get: (key: Key) => Promise<Value>;
}): (key: Key) => Promise<Value | undefined> {
  return async (key: Key): Promise<Value | undefined> => {
    try {
      const result = await get(key);

      return result;
    } catch (error) {
      if (error.notFound || error.code === 'KEY_NOT_FOUND') {
        return undefined;
      }
      throw error;
    }
  };
}

export function createTryGetLatest<Key, Value>({
  db,
  latestKey,
  deserializeResult,
  get,
}: {
  readonly db: LevelUp;
  readonly latestKey: string;
  readonly deserializeResult: (latestResult: Buffer) => Key;
  readonly get: (key: Key) => Promise<Value>;
}): () => Promise<Value | undefined> {
  return async (): Promise<Value | undefined> => {
    try {
      const result = await db.get(latestKey);
      const value = await get(deserializeResult(result as Buffer));

      return value;
    } catch (error) {
      if (error.notFound || error.code === 'KEY_NOT_FOUND') {
        return undefined;
      }
      throw error;
    }
  };
}

export function createReadStorage<Key, Value>({
  db,
  serializeKey,
  deserializeValue,
}: {
  readonly db: LevelUp;
  readonly serializeKey: SerializeKey<Key>;
  readonly deserializeValue: (value: Buffer) => Value;
}): ReadStorage<Key, Value> {
  const get = async (key: Key): Promise<Value> => {
    const serialized = serializeKey(key);
    try {
      const result = await db.get(serialized);

      return deserializeValue(result as Buffer);
    } catch (error) {
      if (error.notFound || error.code === 'KEY_NOT_FOUND') {
        throw new KeyNotFoundError(serialized);
      }

      throw error;
    }
  };

  return { get, tryGet: createTryGet({ get }) };
}

export function createAll$<Value>({
  db,
  minKey,
  maxKey,
  deserializeValue,
}: {
  readonly db: LevelUp;
  readonly minKey: string;
  readonly maxKey: string;
  readonly deserializeValue: (value: Buffer) => Value;
}): Observable<Value> {
  return streamToObservable(() =>
    db.createValueStream({
      gte: minKey,
      lte: maxKey,
    }),
  ).pipe(map(deserializeValue));
}

export function createReadAllStorage<Key, Value>({
  db,
  serializeKey,
  minKey,
  maxKey,
  deserializeValue,
}: {
  readonly db: LevelUp;
  readonly serializeKey: SerializeKey<Key>;
  readonly minKey: string;
  readonly maxKey: string;
  readonly deserializeValue: (value: Buffer) => Value;
}): ReadAllStorage<Key, Value> {
  const readStorage = createReadStorage({
    db,
    serializeKey,
    deserializeValue,
  });

  return {
    get: readStorage.get,
    tryGet: readStorage.tryGet,
    all$: createAll$({ db, minKey, maxKey, deserializeValue }),
  };
}

export function createReadGetAllStorage<Key, Keys, Value>({
  db,
  serializeKey,
  getMinKey,
  getMaxKey,
  deserializeValue,
}: {
  readonly db: LevelUp;
  readonly serializeKey: SerializeKey<Key>;
  readonly getMinKey: (keys: Keys) => string;
  readonly getMaxKey: (keys: Keys) => string;
  readonly deserializeValue: (value: Buffer) => Value;
}): ReadGetAllStorage<Key, Keys, Value> {
  const readStorage = createReadStorage({
    db,
    serializeKey,
    deserializeValue,
  });

  return {
    get: readStorage.get,
    tryGet: readStorage.tryGet,
    getAll$: (keys: Keys) =>
      createAll$({
        db,
        minKey: getMinKey(keys),
        maxKey: getMaxKey(keys),
        deserializeValue,
      }),
  };
}

export function createTryGetMetadata<Value>({
  get,
}: {
  readonly get: () => Promise<Value>;
}): () => Promise<Value | undefined> {
  return async (): Promise<Value | undefined> => {
    try {
      const result = await get();

      return result;
    } catch (error) {
      if (error.notFound || error.code === 'KEY_NOT_FOUND') {
        return undefined;
      }
      throw error;
    }
  };
}

export function createReadMetadataStorage<Value>({
  db,
  key,
  deserializeValue,
}: {
  readonly db: LevelUp;
  readonly key: string;
  readonly deserializeValue: (value: Buffer) => Value;
}): ReadMetadataStorage<Value> {
  const get = async (): Promise<Value> => {
    try {
      const result = await db.get(key);

      return deserializeValue(result as Buffer);
    } catch (error) {
      if (error.notFound || error.code === 'KEY_NOT_FOUND') {
        throw new KeyNotFoundError(key);
      }

      throw error;
    }
  };

  return { get, tryGet: createTryGet({ get }) as ReadMetadataStorage<Value>['tryGet'] };
}
