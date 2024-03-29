// tslint:disable no-var-before-return prefer-immediate-return
import {
  ReadAllFindStorage,
  ReadAllStorage,
  ReadFindStorage,
  ReadStorage,
  StorageReturn,
  StreamOptions,
} from '@neo-one/node-core';
import { LevelUp } from 'levelup';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { KeyNotFoundError } from './errors';
import { streamToObservable } from './streamToObservable';

type SerializeKey<Key> = (key: Key) => Buffer;

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
        throw new KeyNotFoundError(serialized.toString('hex'));
      }

      throw error;
    }
  };

  return { get, tryGet: createTryGet({ get }) };
}

export function createAll$<Value>({
  db,
  range,
  deserializeValue,
}: {
  readonly db: LevelUp;
  readonly range: StreamOptions;
  readonly deserializeValue: (value: Buffer) => Value;
}): Observable<Value> {
  return streamToObservable(() => db.createValueStream(range)).pipe(map(deserializeValue));
}

export function createReadAllStorage<Key, Value>({
  db,
  serializeKey,
  range,
  deserializeValue,
}: {
  readonly db: LevelUp;
  readonly serializeKey: SerializeKey<Key>;
  readonly range: StreamOptions;
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
    all$: createAll$({ db, range, deserializeValue }),
  };
}

export function createFind$<Key, Value>({
  db,
  getSearchRange,
  deserializeKey,
  deserializeValue,
  prefixSize,
}: {
  readonly db: LevelUp;
  readonly getSearchRange: (key: Buffer, secondary?: Buffer) => StreamOptions;
  readonly deserializeKey: (key: Buffer) => Key;
  readonly deserializeValue: (value: Buffer) => Value;
  readonly prefixSize: number;
}): (lookup: Buffer, secondaryLookup?: Buffer) => Observable<StorageReturn<Key, Value>> {
  return (lookup: Buffer, secondaryLookup?: Buffer) =>
    streamToObservable<StorageReturn<Buffer, Buffer>>(() =>
      db.createReadStream(getSearchRange(lookup, secondaryLookup)),
    ).pipe(map(({ key, value }) => ({ key: deserializeKey(key.slice(prefixSize)), value: deserializeValue(value) })));
}

export function createReadFindStorage<Key, Value>({
  db,
  getSearchRange,
  serializeKey,
  deserializeKey,
  deserializeValue,
  prefixSize,
}: {
  readonly db: LevelUp;
  readonly getSearchRange: (key: Buffer, secondary?: Buffer) => StreamOptions;
  readonly serializeKey: SerializeKey<Key>;
  readonly deserializeKey: (value: Buffer) => Key;
  readonly deserializeValue: (value: Buffer) => Value;
  readonly prefixSize: number;
}): ReadFindStorage<Key, Value> {
  const readStorage = createReadStorage({
    db,
    serializeKey,
    deserializeValue,
  });

  return {
    get: readStorage.get,
    tryGet: readStorage.tryGet,
    find$: createFind$({
      db,
      getSearchRange,
      deserializeKey,
      deserializeValue,
      prefixSize,
    }),
  };
}

export function createReadAllFindStorage<Key, Value>({
  db,
  searchRange,
  getSearchRange,
  serializeKey,
  deserializeKey,
  deserializeValue,
  prefixSize,
}: {
  readonly db: LevelUp;
  readonly searchRange: StreamOptions;
  readonly getSearchRange: (key: Buffer, secondary?: Buffer) => StreamOptions;
  readonly serializeKey: SerializeKey<Key>;
  readonly deserializeKey: (value: Buffer) => Key;
  readonly deserializeValue: (value: Buffer) => Value;
  readonly prefixSize: number;
}): ReadAllFindStorage<Key, Value> {
  const readStorage = createReadStorage({
    db,
    serializeKey,
    deserializeValue,
  });

  const all$ = createAll$({ db, range: searchRange, deserializeValue });

  return {
    get: readStorage.get,
    tryGet: readStorage.tryGet,
    find$: createFind$({
      db,
      getSearchRange,
      deserializeKey,
      deserializeValue,
      prefixSize,
    }),
    all$,
  };
}
