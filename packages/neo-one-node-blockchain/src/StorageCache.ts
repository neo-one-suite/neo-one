import { AddChange, Change, ChangeSet, DeleteChange, ReadStorage } from '@neo-one/node-core';

interface DeleteMetadataTrackedChanged {
  readonly type: 'delete';
}
interface AddMetadataTrackedChange<Value> {
  readonly type: 'add';
  readonly value: Value;
  readonly subType: 'add' | 'update';
}

interface DeleteTrackedChange<Key> extends DeleteMetadataTrackedChanged {
  readonly key: Key;
}
interface AddTrackedChange<Key, Value> extends AddMetadataTrackedChange<Value> {
  readonly key: Key;
}

type TrackedChange<Key, Value> = DeleteTrackedChange<Key> | AddTrackedChange<Key, Value>;

const isDeleteTrackedChange = <K, V>(value: TrackedChange<K, V>): value is DeleteTrackedChange<K> =>
  value.type === 'delete';

export interface TrackedDeleteChangeWithKey<Key> {
  readonly type: string;
  readonly key: string;
  readonly value: DeleteTrackedChange<Key>;
}

export interface TrackedAddChangeWithKey<Key, Value> {
  readonly type: string;
  readonly key: string;
  readonly value: AddTrackedChange<Key, Value>;
}

type TrackedChangeWithKey<Key, Value> = TrackedDeleteChangeWithKey<Key> | TrackedAddChangeWithKey<Key, Value>;

export type TrackedChangeSet<Key, Value> = ReadonlyArray<TrackedChangeWithKey<Key, Value>>;

type GetFunc<Key, Value> = (key: Key) => Promise<Value>;
type TryGetFunc<Key, Value> = (key: Key) => Promise<Value | undefined>;

type CreateAddChangeNoKey<Value> = (value: Value) => AddChange;
type CreateAddChangeKey<Value, Key> = (key: Key, value: Value) => AddChange;

type CreateAddChange<Value, Key = undefined> = Key extends undefined
  ? CreateAddChangeNoKey<Value>
  : CreateAddChangeKey<Key, Value>;

function createGet<Key, Value>({
  tryGetTracked,
  readStorage,
}: {
  // tslint:disable-next-line: no-any
  readonly tryGetTracked: (key: Key) => TrackedChange<Key, any> | undefined;
  readonly readStorage: () => ReadStorage<Key, Value>;
}): GetFunc<Key, Value> {
  return async (key: Key): Promise<Value> => {
    const trackedChange = tryGetTracked(key);
    if (trackedChange !== undefined) {
      if (trackedChange.type === 'delete') {
        throw new Error('Not found');
      }

      return trackedChange.value;
    }

    return readStorage().get(key);
  };
}

function createTryGet<Key, Value>({
  tryGetTracked,
  readStorage,
}: {
  // tslint:disable-next-line: no-any
  readonly tryGetTracked: (key: Key) => TrackedChange<Key, any> | undefined;
  readonly readStorage: () => ReadStorage<Key, Value>;
}): TryGetFunc<Key, Value> {
  return async (key: Key): Promise<Value | undefined> => {
    const trackedChange = tryGetTracked(key);
    if (trackedChange !== undefined) {
      if (trackedChange.type === 'delete') {
        return undefined;
      }

      return trackedChange.value;
    }

    return readStorage().tryGet(key);
  };
}

interface BaseReadStorageCacheOptions<Key, Value> {
  readonly readStorage: () => ReadStorage<Key, Value>;
  readonly name: string;
  readonly createAddChange: CreateAddChange<Key, Value>;
  readonly createDeleteChange?: (key: Key) => DeleteChange;
  readonly onAdd?: (value: Value) => Promise<void>;
}

class BaseReadStorageCache<Key, Value> {
  public readonly get: GetFunc<Key, Value>;
  public readonly tryGet: TryGetFunc<Key, Value>;
  public readonly tryGetValue: TryGetFunc<Key, Value>;
  public readonly onAdd: ((value: Value) => Promise<void>) | undefined;
  public readonly name: string;
  // tslint:disable-next-line readonly-keyword
  public mutableValues: { [key: string]: TrackedChange<Key, Value> };
  protected readonly readStorage: () => ReadStorage<Key, Value>;
  protected readonly createAddChange: CreateAddChange<Key, Value>;
  protected readonly createDeleteChange: ((key: Key) => DeleteChange) | undefined;

  public constructor(options: BaseReadStorageCacheOptions<Key, Value>) {
    this.readStorage = options.readStorage;
    this.name = options.name;
    this.createAddChange = options.createAddChange;
    this.createDeleteChange = options.createDeleteChange;
    this.onAdd = options.onAdd;
    this.mutableValues = {};

    this.get = createGet({
      readStorage: this.readStorage,
      tryGetTracked: this.tryGetTracked.bind(this),
    });

    this.tryGet = createTryGet({
      readStorage: this.readStorage,
      tryGetTracked: this.tryGetTracked.bind(this),
    });
    this.tryGetValue = (key) => this.readStorage().tryGet(key);
  }

  public getChangeSet(): ChangeSet {
    const createDeleteChange = this.createDeleteChange;

    return Object.values(this.mutableValues).map<Change>((tracked) => {
      if (isDeleteTrackedChange(tracked)) {
        if (createDeleteChange === undefined) {
          throw new Error('Invalid delete');
        }

        return { type: 'delete', change: createDeleteChange(tracked.key) };
      }

      return { type: 'add', change: this.createAddChange(tracked.key, tracked.value), subType: tracked.subType };
    });
  }

  public clearChangeSet(): void {
    this.mutableValues = {};
  }

  public getTrackedChangeSet(): TrackedChangeSet<Key, Value> {
    const createDeleteChange = this.createDeleteChange;

    return Object.entries(this.mutableValues).map(([key, tracked]) => {
      if (isDeleteTrackedChange(tracked)) {
        if (createDeleteChange === undefined) {
          throw new Error('Invalid delete');
        }

        return { type: createDeleteChange(tracked.key).type, key, value: tracked };
      }

      return { type: this.createAddChange(tracked.key, tracked.value).type, key, value: tracked };
    });
  }

  public tryGetTracked(_key: Key): TrackedChange<Key, Value> | undefined {
    throw new Error('Not Implemented');
  }
}

interface ReadStorageCacheOptions<Key, Value> extends BaseReadStorageCacheOptions<Key, Value> {
  readonly getKeyString: (key: Key) => string;
}

class ReadStorageCache<Key, Value> extends BaseReadStorageCache<Key, Value> {
  public readonly getKeyString: (key: Key) => string;

  public constructor(options: ReadStorageCacheOptions<Key, Value>) {
    super({
      readStorage: options.readStorage,
      name: options.name,
      createAddChange: options.createAddChange,
      createDeleteChange: options.createDeleteChange,
      onAdd: options.onAdd,
    });

    this.getKeyString = options.getKeyString;
  }

  public tryGetTracked(key: Key): TrackedChange<Key, Value> | undefined {
    return this.mutableValues[this.getKeyString(key)];
  }

  public addTrackedChange(key: string, value: TrackedChange<Key, Value>): void {
    this.mutableValues[key] = value;
  }
}

type AddFunc<Key, Value> = (key: Key, value: Value) => Promise<void>;

function createAdd<Key, Value>({
  cache,
  getKeyString,
  allowDupes,
}: {
  readonly cache: ReadStorageCache<Key, Value>;
  readonly getKeyString: (key: Key) => string;
  readonly allowDupes?: boolean;
}): AddFunc<Key, Value> {
  return async (key: Key, value: Value): Promise<void> => {
    if (!allowDupes) {
      const currentValue = await cache.tryGet(key);
      if (currentValue !== undefined) {
        throw new Error(`Attempted to add an already existing object for key ` + `${cache.name}:${getKeyString(key)}.`);
      }
    }

    if (cache.onAdd !== undefined) {
      await cache.onAdd(value);
    }

    const trackedChange = cache.tryGetTracked(key);
    // tslint:disable-next-line: no-object-mutation
    cache.mutableValues[cache.getKeyString(key)] = {
      type: 'add',
      value,
      key,
      // trackedChange can only be a delete type if it's undefined, otherwise cache.tryGet above would have returned a value
      // In that case, we ignore the delete and register this as a storage item update
      // Note that we only really care about this for storage items, where allowDupes is always false
      subType: trackedChange === undefined ? 'add' : 'update',
    };
  };
}

interface ReadAddStorageCacheOptions<Key, Value> extends ReadStorageCacheOptions<Key, Value> {
  readonly allowDupes?: boolean;
}

export class ReadAddStorageCache<Key, Value> extends ReadStorageCache<Key, Value> {
  public readonly add: AddFunc<Key, Value>;

  public constructor(options: ReadAddStorageCacheOptions<Key, Value>) {
    super({
      readStorage: options.readStorage,
      name: options.name,
      getKeyString: options.getKeyString,
      createAddChange: options.createAddChange,
      createDeleteChange: options.createDeleteChange,
      onAdd: options.onAdd,
    });

    this.add = createAdd({
      cache: this,
      getKeyString: options.getKeyString,
      allowDupes: options.allowDupes,
    });
  }
}

// interface BaseReadMetadataStorageCacheOptions<Value> {
//   readonly readStorage: () => ReadMetadataStorage<Value>;
//   readonly name: string;
//   readonly createAddChange: CreateAddChange<Value>;
// }

// class BaseReadMetadataStorageCache<Value> {
//   public readonly get: ReadMetadataStorage<Value>['get'];
//   public readonly tryGet: ReadMetadataStorage<Value>['tryGet'];
//   public readonly tryGetValue: ReadMetadataStorage<Value>['tryGet'];
//   public readonly name: string;
//   public readonly mutableValues: { [key: string]: TrackedChange<Key, Value>}
//   public constructor(options: BaseReadMetadataStorageCacheOptions<Value>) {

//   }
// }

// export class ReadMetaDataStorageCache<Value> extends BaseReadMetadataStorageCache<Value> {

// }

// export class ReadUpdateMetadataStorageCache<Value> extends ReadMetaDataStorageCache<Value> {
//   public readonly update: (value: Value) => Promise<void>;

//   public constructor(options: ReadUpdateMetadataStorageCacheOptions<Value>) {
//     super({
//       readStorage:
//     })
//   }
// }
