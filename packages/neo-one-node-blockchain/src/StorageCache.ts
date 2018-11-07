import { common, UInt256 } from '@neo-one/client-common';
import {
  AddChange,
  Block,
  Change,
  ChangeSet,
  DeleteChange,
  Output,
  OutputKey,
  ReadAllStorage,
  ReadGetAllStorage,
  ReadMetadataStorage,
  ReadStorage,
} from '@neo-one/node-core';
import { utils as commonUtils } from '@neo-one/utils';
import { concat, defer, EMPTY, Observable, of as _of } from 'rxjs';
import { concatMap } from 'rxjs/operators';
type TrackedChange<Key, AddValue, Value> =
  | { readonly type: 'add'; readonly addValue: AddValue; readonly value: Value }
  | { readonly type: 'delete'; readonly key: Key };
type GetFunc<Key, Value> = ((key: Key) => Promise<Value>);
type TryGetFunc<Key, Value> = ((key: Key) => Promise<Value | undefined>);

function createGet<Key, Value>({
  tryGetTracked,
  readStorage,
}: {
  // tslint:disable-next-line no-any
  readonly tryGetTracked: ((key: Key) => TrackedChange<Key, any, Value> | undefined);
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
  // tslint:disable-next-line no-any
  readonly tryGetTracked: ((key: Key) => TrackedChange<Key, any, Value> | undefined);
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

interface BaseReadStorageCacheOptions<Key, AddValue, Value> {
  readonly readStorage: () => ReadStorage<Key, Value>;
  readonly name: string;
  readonly createAddChange: ((value: AddValue) => AddChange);
  readonly createDeleteChange?: ((key: Key) => DeleteChange);
  readonly onAdd?: ((value: AddValue) => Promise<void>);
}

export class BaseReadStorageCache<Key, AddValue, Value> {
  public readonly get: GetFunc<Key, Value>;
  public readonly tryGet: TryGetFunc<Key, Value>;
  public readonly onAdd: ((value: AddValue) => Promise<void>) | undefined;
  public readonly name: string;
  // tslint:disable-next-line readonly-keyword
  public readonly mutableValues: { [key: string]: TrackedChange<Key, AddValue, Value> };
  protected readonly readStorage: () => ReadStorage<Key, Value>;
  protected readonly createAddChange: ((value: AddValue) => AddChange);
  protected readonly createDeleteChange: ((key: Key) => DeleteChange) | undefined;

  public constructor(options: BaseReadStorageCacheOptions<Key, AddValue, Value>) {
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
  }

  public getChangeSet(): ChangeSet {
    const createDeleteChange = this.createDeleteChange;

    return Object.values(this.mutableValues).map<Change>((value) => {
      if (value.type === 'delete') {
        if (createDeleteChange === undefined) {
          throw new Error('Invalid delete');
        }

        return { type: 'delete', change: createDeleteChange(value.key) };
      }

      return { type: 'add', change: this.createAddChange(value.addValue) };
    });
  }

  protected tryGetTracked(_key: Key): TrackedChange<Key, AddValue, Value> | undefined {
    throw new Error('Not Implemented');
  }
}

interface ReadStorageCacheOptions<Key, AddValue, Value> extends BaseReadStorageCacheOptions<Key, AddValue, Value> {
  readonly getKeyString: ((key: Key) => string);
}

class ReadStorageCache<Key, AddValue, Value> extends BaseReadStorageCache<Key, AddValue, Value> {
  public readonly getKeyString: ((key: Key) => string);

  public constructor(options: ReadStorageCacheOptions<Key, AddValue, Value>) {
    super({
      readStorage: options.readStorage,
      name: options.name,
      createAddChange: options.createAddChange,
      createDeleteChange: options.createDeleteChange,
      onAdd: options.onAdd,
    });

    this.getKeyString = options.getKeyString;
  }

  protected tryGetTracked(key: Key): TrackedChange<Key, AddValue, Value> | undefined {
    return this.mutableValues[this.getKeyString(key)];
  }
}

interface ReadAllStorageCacheOptions<Key, Value> {
  readonly readAllStorage: () => ReadAllStorage<Key, Value>;
  readonly name: string;
  readonly createAddChange: ((value: Value) => AddChange);
  readonly createDeleteChange?: ((key: Key) => DeleteChange);
  readonly onAdd?: ((value: Value) => Promise<void>);
  readonly getKeyString: ((key: Key) => string);
  readonly getKeyFromValue: ((value: Value) => Key);
}

class ReadAllStorageCache<Key, Value> extends ReadStorageCache<Key, Value, Value> {
  public readonly all$: Observable<Value>;
  protected readonly readAllStorage: () => ReadAllStorage<Key, Value>;
  protected readonly getKeyFromValue: ((value: Value) => Key);

  public constructor(options: ReadAllStorageCacheOptions<Key, Value>) {
    super({
      readStorage: () => ({
        get: options.readAllStorage().get,
        tryGet: options.readAllStorage().tryGet,
      }),
      name: options.name,
      getKeyString: options.getKeyString,
      createAddChange: options.createAddChange,
      createDeleteChange: options.createDeleteChange,
      onAdd: options.onAdd,
    });

    this.readAllStorage = options.readAllStorage;
    this.getKeyFromValue = options.getKeyFromValue;

    this.all$ = concat(
      defer(() =>
        this.readAllStorage().all$.pipe(
          concatMap((value) => {
            const trackedChange = this.tryGetTracked(this.getKeyFromValue(value));

            if (trackedChange !== undefined) {
              return EMPTY;
            }

            return _of(value);
          }),
        ),
      ),
      defer(() =>
        _of(
          ...Object.values(this.mutableValues)
            .map((value) => (value.type === 'add' ? value.value : undefined))
            .filter(commonUtils.notNull),
        ),
      ),
    );
  }
}

interface ReadGetAllStorageCacheOptions<Key, PartialKey, Value> {
  readonly readGetAllStorage: () => ReadGetAllStorage<Key, PartialKey, Value>;
  readonly name: string;
  readonly createAddChange: ((value: Value) => AddChange);
  readonly createDeleteChange?: ((key: Key) => DeleteChange);
  readonly onAdd?: ((value: Value) => Promise<void>);
  readonly getKeyString: ((key: Key) => string);
  readonly getKeyFromValue: ((value: Value) => Key);
  readonly matchesPartialKey: ((value: Value, key: PartialKey) => boolean);
}

class ReadGetAllStorageCache<Key, PartialKey, Value> extends ReadStorageCache<Key, Value, Value> {
  public readonly getAll$: ((key: PartialKey) => Observable<Value>);
  protected readonly readGetAllStorage: () => ReadGetAllStorage<Key, PartialKey, Value>;
  protected readonly getKeyFromValue: ((value: Value) => Key);
  protected readonly matchesPartialKey: ((value: Value, key: PartialKey) => boolean);

  public constructor(options: ReadGetAllStorageCacheOptions<Key, PartialKey, Value>) {
    super({
      readStorage: () => ({
        get: options.readGetAllStorage().get,
        tryGet: options.readGetAllStorage().tryGet,
      }),
      name: options.name,
      getKeyString: options.getKeyString,
      createAddChange: options.createAddChange,
      createDeleteChange: options.createDeleteChange,
      onAdd: options.onAdd,
    });

    this.readGetAllStorage = options.readGetAllStorage;
    this.getKeyFromValue = options.getKeyFromValue;
    this.matchesPartialKey = options.matchesPartialKey;

    this.getAll$ = (key: PartialKey): Observable<Value> =>
      concat(
        defer(() =>
          this.readGetAllStorage()
            .getAll$(key)
            .pipe(
              concatMap((value) => {
                const trackedChange = this.tryGetTracked(this.getKeyFromValue(value));

                if (trackedChange !== undefined) {
                  return EMPTY;
                }

                return _of(value);
              }),
            ),
        ),
        defer(() =>
          _of(
            ...Object.values(this.mutableValues)
              .map((value) =>
                value.type === 'add' && this.matchesPartialKey(value.value, key) ? value.value : undefined,
              )
              .filter(commonUtils.notNull),
          ),
        ),
      );
  }
}
type AddFunc<Value> = ((value: Value, force?: boolean) => Promise<void>);

function createAdd<Key, Value>({
  cache,
  getKeyFromValue,
  getKeyString,
}: {
  readonly cache: ReadStorageCache<Key, Value, Value>;
  readonly getKeyFromValue: ((value: Value) => Key);
  readonly getKeyString: ((key: Key) => string);
}): AddFunc<Value> {
  return async (value: Value, force?): Promise<void> => {
    const key = getKeyFromValue(value);

    if (!force) {
      const currentValue = await cache.tryGet(key);
      if (currentValue !== undefined) {
        throw new Error(`Attempted to add an already existing object for key ` + `${cache.name}:${getKeyString(key)}.`);
      }
    }

    if (cache.onAdd !== undefined) {
      await cache.onAdd(value);
    }

    // tslint:disable-next-line no-object-mutation
    cache.mutableValues[cache.getKeyString(key)] = {
      type: 'add',
      addValue: value,
      value,
    };
  };
}
type UpdateFunc<Value, Update> = ((value: Value, update: Update) => Promise<Value>);

function createUpdate<Key, Value, Update>({
  cache,
  update: updateFunc,
  getKeyFromValue,
}: {
  readonly cache: ReadStorageCache<Key, Value, Value>;
  readonly update: ((value: Value, update: Update) => Value);
  readonly getKeyFromValue: ((value: Value) => Key);
}): UpdateFunc<Value, Update> {
  return async (value: Value, update: Update): Promise<Value> => {
    const key = getKeyFromValue(value);

    const updatedValue = updateFunc(value, update);
    // tslint:disable-next-line no-object-mutation
    cache.mutableValues[cache.getKeyString(key)] = {
      type: 'add',
      addValue: updatedValue,
      value: updatedValue,
    };

    return updatedValue;
  };
}
type DeleteFunc<Key> = ((key: Key) => Promise<void>);

// tslint:disable-next-line no-any
function createDelete<Key>({ cache }: { readonly cache: ReadStorageCache<Key, any, any> }): DeleteFunc<Key> {
  return async (key: Key): Promise<void> => {
    // tslint:disable-next-line no-object-mutation
    cache.mutableValues[cache.getKeyString(key)] = { type: 'delete', key };
  };
}

interface ReadAddUpdateDeleteStorageCacheOptions<Key, Value, Update>
  extends ReadStorageCacheOptions<Key, Value, Value> {
  readonly update: ((value: Value, update: Update) => Value);
  readonly getKeyFromValue: ((value: Value) => Key);
}

export class ReadAddUpdateDeleteStorageCache<Key, Value, Update> extends ReadStorageCache<Key, Value, Value> {
  public readonly add: AddFunc<Value>;
  public readonly update: UpdateFunc<Value, Update>;
  public readonly delete: DeleteFunc<Key>;

  public constructor(options: ReadAddUpdateDeleteStorageCacheOptions<Key, Value, Update>) {
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
      getKeyFromValue: options.getKeyFromValue,
      getKeyString: options.getKeyString,
    });

    this.update = createUpdate({
      cache: this,
      update: options.update,
      getKeyFromValue: options.getKeyFromValue,
    });

    this.delete = createDelete({ cache: this });
  }
}

interface ReadAddUpdateStorageCacheOptions<Key, Value, Update> extends ReadStorageCacheOptions<Key, Value, Value> {
  readonly update: ((value: Value, update: Update) => Value);
  readonly getKeyFromValue: ((value: Value) => Key);
}

export class ReadAddUpdateStorageCache<Key, Value, Update> extends ReadStorageCache<Key, Value, Value> {
  public readonly add: AddFunc<Value>;
  public readonly update: UpdateFunc<Value, Update>;

  public constructor(options: ReadAddUpdateStorageCacheOptions<Key, Value, Update>) {
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
      getKeyFromValue: options.getKeyFromValue,
      getKeyString: options.getKeyString,
    });

    this.update = createUpdate({
      cache: this,
      update: options.update,
      getKeyFromValue: options.getKeyFromValue,
    });
  }
}

interface ReadAddDeleteStorageCacheOptions<Key, Value> extends ReadStorageCacheOptions<Key, Value, Value> {
  readonly getKeyFromValue: ((value: Value) => Key);
}

export class ReadAddDeleteStorageCache<Key, Value> extends ReadStorageCache<Key, Value, Value> {
  public readonly add: AddFunc<Value>;
  public readonly delete: DeleteFunc<Key>;

  public constructor(options: ReadAddDeleteStorageCacheOptions<Key, Value>) {
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
      getKeyFromValue: options.getKeyFromValue,
      getKeyString: options.getKeyString,
    });

    this.delete = createDelete({ cache: this });
  }
}

interface ReadAddStorageCacheOptions<Key, Value> extends ReadStorageCacheOptions<Key, Value, Value> {
  readonly getKeyFromValue: ((value: Value) => Key);
}

export class ReadAddStorageCache<Key, Value> extends ReadStorageCache<Key, Value, Value> {
  public readonly add: AddFunc<Value>;

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
      getKeyFromValue: options.getKeyFromValue,
      getKeyString: options.getKeyString,
    });
  }
}

interface ReadGetAllAddDeleteStorageCacheOptions<Key, PartialKey, Value>
  extends ReadGetAllStorageCacheOptions<Key, PartialKey, Value> {
  readonly getKeyFromValue: ((value: Value) => Key);
}

export class ReadGetAllAddDeleteStorageCache<Key, PartialKey, Value> extends ReadGetAllStorageCache<
  Key,
  PartialKey,
  Value
> {
  public readonly add: AddFunc<Value>;
  public readonly delete: DeleteFunc<Key>;

  public constructor(options: ReadGetAllAddDeleteStorageCacheOptions<Key, PartialKey, Value>) {
    super({
      readGetAllStorage: options.readGetAllStorage,
      name: options.name,
      getKeyString: options.getKeyString,
      createAddChange: options.createAddChange,
      createDeleteChange: options.createDeleteChange,
      onAdd: options.onAdd,
      getKeyFromValue: options.getKeyFromValue,
      matchesPartialKey: options.matchesPartialKey,
    });

    this.add = createAdd({
      cache: this,
      getKeyFromValue: options.getKeyFromValue,
      getKeyString: options.getKeyString,
    });

    this.delete = createDelete({ cache: this });
  }
}

interface ReadGetAllAddUpdateDeleteStorageCacheOptions<Key, PartialKey, Value, Update>
  extends ReadGetAllStorageCacheOptions<Key, PartialKey, Value> {
  readonly update: ((value: Value, update: Update) => Value);
  readonly getKeyFromValue: ((value: Value) => Key);
}

export class ReadGetAllAddUpdateDeleteStorageCache<Key, PartialKey, Value, Update> extends ReadGetAllStorageCache<
  Key,
  PartialKey,
  Value
> {
  public readonly add: AddFunc<Value>;
  public readonly update: UpdateFunc<Value, Update>;
  public readonly delete: DeleteFunc<Key>;

  public constructor(options: ReadGetAllAddUpdateDeleteStorageCacheOptions<Key, PartialKey, Value, Update>) {
    super({
      readGetAllStorage: options.readGetAllStorage,
      name: options.name,
      getKeyString: options.getKeyString,
      createAddChange: options.createAddChange,
      createDeleteChange: options.createDeleteChange,
      onAdd: options.onAdd,
      getKeyFromValue: options.getKeyFromValue,
      matchesPartialKey: options.matchesPartialKey,
    });

    this.add = createAdd({
      cache: this,
      getKeyFromValue: options.getKeyFromValue,
      getKeyString: options.getKeyString,
    });

    this.update = createUpdate({
      cache: this,
      update: options.update,
      getKeyFromValue: options.getKeyFromValue,
    });

    this.delete = createDelete({ cache: this });
  }
}

interface ReadGetAllAddStorageCacheOptions<Key, PartialKey, Value>
  extends ReadGetAllStorageCacheOptions<Key, PartialKey, Value> {
  readonly getKeyFromValue: ((value: Value) => Key);
}

export class ReadGetAllAddStorageCache<Key, PartialKey, Value> extends ReadGetAllStorageCache<Key, PartialKey, Value> {
  public readonly add: AddFunc<Value>;

  public constructor(options: ReadGetAllAddStorageCacheOptions<Key, PartialKey, Value>) {
    super({
      readGetAllStorage: options.readGetAllStorage,
      name: options.name,
      getKeyString: options.getKeyString,
      createAddChange: options.createAddChange,
      createDeleteChange: options.createDeleteChange,
      onAdd: options.onAdd,
      getKeyFromValue: options.getKeyFromValue,
      matchesPartialKey: options.matchesPartialKey,
    });

    this.add = createAdd({
      cache: this,
      getKeyFromValue: options.getKeyFromValue,
      getKeyString: options.getKeyString,
    });
  }
}

interface ReadAllAddUpdateDeleteStorageCacheOptions<Key, Value, Update> extends ReadAllStorageCacheOptions<Key, Value> {
  readonly update: ((value: Value, update: Update) => Value);
  readonly getKeyFromValue: ((value: Value) => Key);
}

export class ReadAllAddUpdateDeleteStorageCache<Key, Value, Update> extends ReadAllStorageCache<Key, Value> {
  public readonly add: AddFunc<Value>;
  public readonly update: UpdateFunc<Value, Update>;
  public readonly delete: DeleteFunc<Key>;

  public constructor(options: ReadAllAddUpdateDeleteStorageCacheOptions<Key, Value, Update>) {
    super({
      readAllStorage: options.readAllStorage,
      name: options.name,
      getKeyString: options.getKeyString,
      createAddChange: options.createAddChange,
      createDeleteChange: options.createDeleteChange,
      onAdd: options.onAdd,
      getKeyFromValue: options.getKeyFromValue,
    });

    this.add = createAdd({
      cache: this,
      getKeyFromValue: options.getKeyFromValue,
      getKeyString: options.getKeyString,
    });

    this.update = createUpdate({
      cache: this,
      update: options.update,
      getKeyFromValue: options.getKeyFromValue,
    });

    this.delete = createDelete({ cache: this });
  }
}

interface ReadAllAddStorageCacheOptions<Key, Value> extends ReadAllStorageCacheOptions<Key, Value> {
  readonly getKeyFromValue: ((value: Value) => Key);
}

export class ReadAllAddStorageCache<Key, Value> extends ReadAllStorageCache<Key, Value> {
  public readonly add: AddFunc<Value>;

  public constructor(options: ReadAllAddStorageCacheOptions<Key, Value>) {
    super({
      readAllStorage: options.readAllStorage,
      name: options.name,
      getKeyString: options.getKeyString,
      createAddChange: options.createAddChange,
      createDeleteChange: options.createDeleteChange,
      onAdd: options.onAdd,
      getKeyFromValue: options.getKeyFromValue,
    });

    this.add = createAdd({
      cache: this,
      getKeyFromValue: options.getKeyFromValue,
      getKeyString: options.getKeyString,
    });
  }
}

interface BlockLikeKey {
  readonly hashOrIndex: Block['hash'] | Block['index'];
}

interface BlockLike {
  readonly hash: Block['hash'];
  readonly index: Block['index'];
}

interface BlockLikeStorageCacheOptions<Value extends BlockLike>
  extends BaseReadStorageCacheOptions<BlockLikeKey, Value, Value> {}

export class BlockLikeStorageCache<Value extends BlockLike> extends BaseReadStorageCache<BlockLikeKey, Value, Value> {
  // tslint:disable-next-line readonly-keyword
  protected readonly mutableIndexValues: { [index: string]: TrackedChange<BlockLikeKey, Value, Value> };

  public constructor(options: BlockLikeStorageCacheOptions<Value>) {
    super({
      readStorage: options.readStorage,
      name: options.name,
      createAddChange: options.createAddChange,
    });

    this.mutableIndexValues = {};
  }

  public async add(value: Value, force?: boolean): Promise<void> {
    if (!force) {
      const currentValue = await this.tryGet({ hashOrIndex: value.index });
      if (currentValue !== undefined) {
        throw new Error('Attempted to add an already existing object.');
      }
    }

    const addValue: TrackedChange<BlockLikeKey, Value, Value> = { type: 'add', addValue: value, value };
    this.mutableValues[common.uInt256ToString(value.hash)] = addValue;
    this.mutableIndexValues[`${value.index}`] = addValue;
  }

  protected tryGetTracked(key: BlockLikeKey): TrackedChange<BlockLikeKey, Value, Value> | undefined {
    if (typeof key.hashOrIndex !== 'number') {
      return this.mutableValues[common.uInt256ToString(key.hashOrIndex)];
    }

    return this.mutableIndexValues[`${key.hashOrIndex}`];
  }
}

interface OutputValue {
  readonly hash: UInt256;
  readonly index: number;
  readonly output: Output;
}

const getOutputValueKeyString = (key: OutputKey): string => `${common.uInt256ToHex(key.hash)}:${key.index}`;

export class OutputStorageCache extends ReadStorageCache<OutputKey, OutputValue, Output> {
  public readonly add: AddFunc<OutputValue>;

  public constructor(readStorage: () => ReadStorage<OutputKey, Output>) {
    super({
      readStorage,
      name: 'output',
      getKeyString: getOutputValueKeyString,
      createAddChange: (value: OutputValue) => ({ type: 'output', value }),
    });

    this.add = async (value: OutputValue, force?): Promise<void> => {
      const key = { hash: value.hash, index: value.index };

      if (!force) {
        const currentValue = await this.tryGet(key);
        if (currentValue !== undefined) {
          throw new Error(
            `Attempted to add an already existing object for key ` + `${this.name}:${this.getKeyString(key)}.`,
          );
        }
      }

      this.mutableValues[this.getKeyString(key)] = {
        type: 'add',
        addValue: value,
        value: value.output,
      };
    };
  }
}
type TrackedMetadataChange<AddValue, Value> =
  | { readonly type: 'add'; readonly addValue: AddValue; readonly value: Value }
  | { readonly type: 'delete' };
type GetMetadataFunc<Value> = ((key?: undefined) => Promise<Value>);
type TryGetMetadataFunc<Value> = ((key?: undefined) => Promise<Value | undefined>);

function createGetMetadata<Key, Value>({
  tryGetTracked,
  readStorage,
}: {
  // tslint:disable-next-line no-any
  readonly tryGetTracked: (() => TrackedMetadataChange<any, Value> | undefined);
  readonly readStorage: () => ReadMetadataStorage<Value>;
}): GetFunc<Key, Value> {
  return async (): Promise<Value> => {
    const trackedChange = tryGetTracked();
    if (trackedChange !== undefined) {
      if (trackedChange.type === 'delete') {
        throw new Error('Not found');
      }

      return trackedChange.value;
    }

    return readStorage().get();
  };
}

function createTryGetMetadata<Value>({
  tryGetTracked,
  readStorage,
}: {
  // tslint:disable-next-line no-any
  readonly tryGetTracked: (() => TrackedMetadataChange<any, Value> | undefined);
  readonly readStorage: () => ReadMetadataStorage<Value>;
}): TryGetMetadataFunc<Value> {
  return async (): Promise<Value | undefined> => {
    const trackedChange = tryGetTracked();
    if (trackedChange !== undefined) {
      if (trackedChange.type === 'delete') {
        return undefined;
      }

      return trackedChange.value;
    }

    return readStorage().tryGet();
  };
}

interface BaseReadMetadataStorageCacheOptions<AddValue, Value> {
  readonly readStorage: () => ReadMetadataStorage<Value>;
  readonly name: string;
  readonly createAddChange: ((value: AddValue) => AddChange);
  readonly createDeleteChange?: (() => DeleteChange);
  readonly onAdd?: ((value: AddValue) => Promise<void>);
}

export class BaseReadMetadataStorageCache<AddValue, Value> {
  public readonly get: GetMetadataFunc<Value>;
  public readonly tryGet: TryGetMetadataFunc<Value>;
  public mutableValue: TrackedMetadataChange<AddValue, Value> | undefined;
  public readonly onAdd: ((value: AddValue) => Promise<void>) | undefined;
  protected readonly readStorage: () => ReadMetadataStorage<Value>;
  protected readonly name: string;
  protected readonly createAddChange: ((value: AddValue) => AddChange);
  protected readonly createDeleteChange: (() => DeleteChange) | undefined;

  public constructor(options: BaseReadMetadataStorageCacheOptions<AddValue, Value>) {
    this.readStorage = options.readStorage;
    this.name = options.name;
    this.createAddChange = options.createAddChange;
    this.createDeleteChange = options.createDeleteChange;
    this.onAdd = options.onAdd;

    this.get = createGetMetadata({
      readStorage: this.readStorage,
      tryGetTracked: this.tryGetTracked.bind(this),
    });

    this.tryGet = createTryGetMetadata({
      readStorage: this.readStorage,
      tryGetTracked: this.tryGetTracked.bind(this),
    });
  }

  public getChangeSet(): ChangeSet {
    const createDeleteChange = this.createDeleteChange;
    const value = this.mutableValue;
    if (value === undefined) {
      return [];
    }

    if (value.type === 'delete') {
      if (createDeleteChange === undefined) {
        throw new Error('Invalid delete');
      }

      return [{ type: 'delete', change: createDeleteChange() }];
    }

    return [{ type: 'add', change: this.createAddChange(value.addValue) }];
  }

  protected tryGetTracked(): TrackedMetadataChange<AddValue, Value> | undefined {
    return this.mutableValue;
  }
}

class ReadMetadataStorageCache<AddValue, Value> extends BaseReadMetadataStorageCache<AddValue, Value> {}

function createAddMetadata<Value>({
  cache,
}: {
  readonly cache: ReadMetadataStorageCache<Value, Value>;
}): AddFunc<Value> {
  return async (value: Value): Promise<void> => {
    if (cache.onAdd !== undefined) {
      await cache.onAdd(value);
    }

    // tslint:disable-next-line no-object-mutation
    cache.mutableValue = {
      type: 'add',
      addValue: value,
      value,
    };
  };
}

function createUpdateMetadata<Value, Update>({
  cache,
  update: updateFunc,
}: {
  readonly cache: ReadMetadataStorageCache<Value, Value>;
  readonly update: ((value: Value, update: Update) => Value);
}): UpdateFunc<Value, Update> {
  return async (value: Value, update: Update): Promise<Value> => {
    const updatedValue = updateFunc(value, update);
    // tslint:disable-next-line no-object-mutation
    cache.mutableValue = {
      type: 'add',
      addValue: updatedValue,
      value: updatedValue,
    };

    return updatedValue;
  };
}

interface ReadAddUpdateMetadataStorageCacheOptions<Value, Update>
  extends BaseReadMetadataStorageCacheOptions<Value, Value> {
  readonly update: ((value: Value, update: Update) => Value);
}

export class ReadAddUpdateMetadataStorageCache<Value, Update> extends ReadMetadataStorageCache<Value, Value> {
  public readonly add: AddFunc<Value>;
  public readonly update: UpdateFunc<Value, Update>;

  public constructor(options: ReadAddUpdateMetadataStorageCacheOptions<Value, Update>) {
    super({
      readStorage: options.readStorage,
      name: options.name,
      createAddChange: options.createAddChange,
      createDeleteChange: options.createDeleteChange,
      onAdd: options.onAdd,
    });

    this.add = createAddMetadata({
      cache: this,
    });

    this.update = createUpdateMetadata({
      cache: this,
      update: options.update,
    });
  }
}
