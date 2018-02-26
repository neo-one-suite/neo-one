/* @flow */
import type { Observable } from 'rxjs/Observable';
import {
  type Block,
  type Output,
  type OutputKey,
  type UInt256,
  common,
} from '@neo-one/client-core';
import {
  type ChangeSet,
  type AddChange,
  type DeleteChange,
  type ReadMetadataStorage,
  type ReadStorage,
  type ReadAllStorage,
  type ReadGetAllStorage,
} from '@neo-one/node-core';

import { concatMap } from 'rxjs/operators';
import { defer } from 'rxjs/observable/defer';
import { empty } from 'rxjs/observable/empty';
import { concat } from 'rxjs/observable/concat';
import { of as _of } from 'rxjs/observable/of';
import { utils as commonUtils } from '@neo-one/utils';

type TrackedChange<Key, AddValue, Value> =
  | {| type: 'add', addValue: AddValue, value: Value |}
  | {| type: 'delete', key: Key |};

type GetFunc<Key, Value> = (key: Key) => Promise<Value>;
type TryGetFunc<Key, Value> = (key: Key) => Promise<?Value>;

function createGet<Key, Value>({
  tryGetTracked,
  readStorage,
}: {|
  tryGetTracked: (key: Key) => ?TrackedChange<Key, *, Value>,
  readStorage: ReadStorage<Key, Value>,
|}): GetFunc<Key, Value> {
  return async (key: Key): Promise<Value> => {
    const trackedChange = tryGetTracked(key);
    if (trackedChange != null) {
      // TODO: Better error
      if (trackedChange.type === 'delete') {
        throw new Error('Not found');
      }

      return trackedChange.value;
    }

    const value = await readStorage.get(key);
    return value;
  };
}

function createTryGet<Key, Value>({
  tryGetTracked,
  readStorage,
}: {|
  tryGetTracked: (key: Key) => ?TrackedChange<Key, *, Value>,
  readStorage: ReadStorage<Key, Value>,
|}): TryGetFunc<Key, Value> {
  return async (key: Key): Promise<?Value> => {
    const trackedChange = tryGetTracked(key);
    if (trackedChange != null) {
      if (trackedChange.type === 'delete') {
        return null;
      }

      return trackedChange.value;
    }

    const value = await readStorage.tryGet(key);
    return value;
  };
}

type BaseReadStorageCacheOptions<Key, AddValue, Value> = {|
  readStorage: ReadStorage<Key, Value>,
  name: string,
  createAddChange: (value: AddValue) => AddChange,
  createDeleteChange?: (key: Key) => DeleteChange,
  onAdd?: (value: AddValue) => Promise<void>,
|};

export class BaseReadStorageCache<Key, AddValue, Value> {
  _readStorage: ReadStorage<Key, Value>;
  _name: string;
  _createAddChange: (value: AddValue) => AddChange;
  _createDeleteChange: ?(key: Key) => DeleteChange;
  _onAdd: ?(value: AddValue) => Promise<void>;
  _values: { [key: string]: TrackedChange<Key, AddValue, Value> };

  get: GetFunc<Key, Value>;
  tryGet: TryGetFunc<Key, Value>;

  constructor(options: BaseReadStorageCacheOptions<Key, AddValue, Value>) {
    this._readStorage = options.readStorage;
    this._name = options.name;
    this._createAddChange = options.createAddChange;
    this._createDeleteChange = options.createDeleteChange;
    this._onAdd = options.onAdd;
    this._values = {};

    this.get = createGet({
      readStorage: this._readStorage,
      tryGetTracked: this._tryGetTracked.bind(this),
    });
    this.tryGet = createTryGet({
      readStorage: this._readStorage,
      tryGetTracked: this._tryGetTracked.bind(this),
    });
  }

  getChangeSet(): ChangeSet {
    const createDeleteChange = this._createDeleteChange;
    return commonUtils.values(this._values).map(value => {
      if (value.type === 'delete') {
        if (createDeleteChange == null) {
          // TODO: Make better
          throw new Error('Invalid delete');
        }

        return { type: 'delete', change: createDeleteChange(value.key) };
      }

      return { type: 'add', change: this._createAddChange(value.addValue) };
    });
  }

  // eslint-disable-next-line
  _tryGetTracked(key: Key): ?TrackedChange<Key, AddValue, Value> {
    throw new Error('Not Implemented');
  }
}

type ReadStorageCacheOptions<Key, AddValue, Value> = {|
  ...BaseReadStorageCacheOptions<Key, AddValue, Value>,
  getKeyString: (key: Key) => string,
|};

class ReadStorageCache<Key, AddValue, Value> extends BaseReadStorageCache<
  Key,
  AddValue,
  Value,
> {
  _getKeyString: (key: Key) => string;

  constructor(options: ReadStorageCacheOptions<Key, AddValue, Value>) {
    super({
      readStorage: options.readStorage,
      name: options.name,
      createAddChange: options.createAddChange,
      createDeleteChange: options.createDeleteChange,
      onAdd: options.onAdd,
    });
    this._getKeyString = options.getKeyString;
  }

  _tryGetTracked(key: Key): ?TrackedChange<Key, AddValue, Value> {
    return this._values[this._getKeyString(key)];
  }
}

type ReadAllStorageCacheOptions<Key, Value> = {|
  readAllStorage: ReadAllStorage<Key, Value>,
  name: string,
  createAddChange: (value: Value) => AddChange,
  createDeleteChange?: (key: Key) => DeleteChange,
  onAdd?: (value: Value) => Promise<void>,
  getKeyString: (key: Key) => string,
  getKeyFromValue: (value: Value) => Key,
|};

class ReadAllStorageCache<Key, Value> extends ReadStorageCache<
  Key,
  Value,
  Value,
> {
  _readAllStorage: ReadAllStorage<Key, Value>;
  _getKeyFromValue: (value: Value) => Key;
  all: Observable<Value>;

  constructor(options: ReadAllStorageCacheOptions<Key, Value>) {
    super({
      readStorage: {
        get: options.readAllStorage.get,
        tryGet: options.readAllStorage.tryGet,
      },
      name: options.name,
      getKeyString: options.getKeyString,
      createAddChange: options.createAddChange,
      createDeleteChange: options.createDeleteChange,
      onAdd: options.onAdd,
    });
    this._readAllStorage = options.readAllStorage;
    this._getKeyFromValue = options.getKeyFromValue;

    this.all = concat(
      defer(() =>
        _of(
          ...commonUtils
            .values(this._values)
            .map(value => (value.type === 'add' ? value.value : null))
            .filter(Boolean),
        ),
      ),
      this._readAllStorage.all.pipe(
        concatMap(value => {
          const trackedChange = this._tryGetTracked(
            this._getKeyFromValue(value),
          );

          if (trackedChange != null && trackedChange.type === 'delete') {
            return empty();
          }

          return _of(value);
        }),
      ),
    );
  }
}

type ReadGetAllStorageCacheOptions<Key, PartialKey, Value> = {|
  readGetAllStorage: ReadGetAllStorage<Key, PartialKey, Value>,
  name: string,
  createAddChange: (value: Value) => AddChange,
  createDeleteChange?: (key: Key) => DeleteChange,
  onAdd?: (value: Value) => Promise<void>,
  getKeyString: (key: Key) => string,
  getKeyFromValue: (value: Value) => Key,
  matchesPartialKey: (value: Value, key: PartialKey) => boolean,
|};

class ReadGetAllStorageCache<Key, PartialKey, Value> extends ReadStorageCache<
  Key,
  Value,
  Value,
> {
  _readGetAllStorage: ReadGetAllStorage<Key, PartialKey, Value>;
  _getKeyFromValue: (value: Value) => Key;
  _matchesPartialKey: (value: Value, key: PartialKey) => boolean;

  getAll: (key: PartialKey) => Observable<Value>;

  constructor(options: ReadGetAllStorageCacheOptions<Key, PartialKey, Value>) {
    super({
      readStorage: {
        get: options.readGetAllStorage.get,
        tryGet: options.readGetAllStorage.tryGet,
      },
      name: options.name,
      getKeyString: options.getKeyString,
      createAddChange: options.createAddChange,
      createDeleteChange: options.createDeleteChange,
      onAdd: options.onAdd,
    });
    this._readGetAllStorage = options.readGetAllStorage;
    this._getKeyFromValue = options.getKeyFromValue;
    this._matchesPartialKey = options.matchesPartialKey;

    this.getAll = (key: PartialKey): Observable<Value> => {
      const createdValues = commonUtils
        .values(this._values)
        .map(
          value =>
            value.type === 'add' && this._matchesPartialKey(value.value, key)
              ? value.value
              : null,
        )
        .filter(Boolean);
      return concat(
        _of(...createdValues),
        this._readGetAllStorage.getAll(key).pipe(
          concatMap(value => {
            const trackedChange = this._tryGetTracked(
              this._getKeyFromValue(value),
            );

            if (trackedChange != null && trackedChange.type === 'delete') {
              return empty();
            }

            return _of(value);
          }),
        ),
      );
    };
  }
}

type AddFunc<Value> = (value: Value, force?: boolean) => Promise<void>;

function createAdd<Key, Value>({
  cache,
  getKeyFromValue,
  getKeyString,
}: {|
  cache: ReadStorageCache<Key, Value, Value>,
  getKeyFromValue: (value: Value) => Key,
  getKeyString: (key: Key) => string,
|}): AddFunc<Value> {
  return async (value: Value, force?: boolean): Promise<void> => {
    const key = getKeyFromValue(value);

    if (!force) {
      const currentValue = await cache.tryGet(key);
      if (currentValue != null) {
        // TODO: Better error
        throw new Error(
          `Attempted to add an already existing object for key ` +
            `${cache._name}:${getKeyString(key)}.`,
        );
      }
    }

    if (cache._onAdd != null) {
      await cache._onAdd(value);
    }

    // eslint-disable-next-line
    cache._values[cache._getKeyString(key)] = {
      type: 'add',
      addValue: value,
      value,
    };
  };
}

type UpdateFunc<Value, Update> = (
  value: Value,
  update: Update,
) => Promise<Value>;

function createUpdate<Key, Value, Update>({
  cache,
  update: updateFunc,
  getKeyFromValue,
}: {|
  cache: ReadStorageCache<Key, Value, Value>,
  update: (value: Value, update: Update) => Value,
  getKeyFromValue: (value: Value) => Key,
|}): UpdateFunc<Value, Update> {
  return async (value: Value, update: Update): Promise<Value> => {
    const key = getKeyFromValue(value);

    const updatedValue = updateFunc(value, update);
    // eslint-disable-next-line
    cache._values[cache._getKeyString(key)] = {
      type: 'add',
      addValue: updatedValue,
      value: updatedValue,
    };

    return updatedValue;
  };
}

type DeleteFunc<Key> = (key: Key) => Promise<void>;

function createDelete<Key>({
  cache,
}: {|
  cache: ReadStorageCache<Key, *, *>,
|}): DeleteFunc<Key> {
  return async (key: Key): Promise<void> => {
    // eslint-disable-next-line
    cache._values[cache._getKeyString(key)] = { type: 'delete', key };
  };
}

type ReadAddUpdateDeleteStorageCacheOptions<Key, Value, Update> = {|
  ...ReadStorageCacheOptions<Key, Value, Value>,
  update: (value: Value, update: Update) => Value,
  getKeyFromValue: (value: Value) => Key,
|};

export class ReadAddUpdateDeleteStorageCache<
  Key,
  Value,
  Update,
> extends ReadStorageCache<Key, Value, Value> {
  add: AddFunc<Value>;
  update: UpdateFunc<Value, Update>;
  delete: DeleteFunc<Key>;

  constructor(
    options: ReadAddUpdateDeleteStorageCacheOptions<Key, Value, Update>,
  ) {
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

type ReadAddUpdateStorageCacheOptions<Key, Value, Update> = {|
  ...ReadStorageCacheOptions<Key, Value, Value>,
  update: (value: Value, update: Update) => Value,
  getKeyFromValue: (value: Value) => Key,
|};

export class ReadAddUpdateStorageCache<
  Key,
  Value,
  Update,
> extends ReadStorageCache<Key, Value, Value> {
  add: AddFunc<Value>;
  update: UpdateFunc<Value, Update>;

  constructor(options: ReadAddUpdateStorageCacheOptions<Key, Value, Update>) {
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

type ReadAddDeleteStorageCacheOptions<Key, Value> = {|
  ...ReadStorageCacheOptions<Key, Value, Value>,
  getKeyFromValue: (value: Value) => Key,
|};

export class ReadAddDeleteStorageCache<Key, Value> extends ReadStorageCache<
  Key,
  Value,
  Value,
> {
  add: AddFunc<Value>;
  delete: DeleteFunc<Key>;

  constructor(options: ReadAddDeleteStorageCacheOptions<Key, Value>) {
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

type ReadAddStorageCacheOptions<Key, Value> = {|
  ...ReadStorageCacheOptions<Key, Value, Value>,
  getKeyFromValue: (value: Value) => Key,
|};

export class ReadAddStorageCache<Key, Value> extends ReadStorageCache<
  Key,
  Value,
  Value,
> {
  add: AddFunc<Value>;

  constructor(options: ReadAddStorageCacheOptions<Key, Value>) {
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

type ReadGetAllAddUpdateDeleteStorageCacheOptions<
  Key,
  PartialKey,
  Value,
  Update,
> = {|
  ...ReadGetAllStorageCacheOptions<Key, PartialKey, Value>,
  update: (value: Value, update: Update) => Value,
  getKeyFromValue: (value: Value) => Key,
|};

export class ReadGetAllAddUpdateDeleteStorageCache<
  Key,
  PartialKey,
  Value,
  Update,
> extends ReadGetAllStorageCache<Key, PartialKey, Value> {
  add: AddFunc<Value>;
  update: UpdateFunc<Value, Update>;
  delete: DeleteFunc<Key>;

  constructor(
    options: ReadGetAllAddUpdateDeleteStorageCacheOptions<
      Key,
      PartialKey,
      Value,
      Update,
    >,
  ) {
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

type ReadGetAllAddStorageCacheOptions<Key, PartialKey, Value> = {|
  ...ReadGetAllStorageCacheOptions<Key, PartialKey, Value>,
  getKeyFromValue: (value: Value) => Key,
|};

export class ReadGetAllAddStorageCache<
  Key,
  PartialKey,
  Value,
> extends ReadGetAllStorageCache<Key, PartialKey, Value> {
  add: AddFunc<Value>;

  constructor(
    options: ReadGetAllAddStorageCacheOptions<Key, PartialKey, Value>,
  ) {
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

type ReadAllAddUpdateDeleteStorageCacheOptions<Key, Value, Update> = {|
  ...ReadAllStorageCacheOptions<Key, Value>,
  update: (value: Value, update: Update) => Value,
  getKeyFromValue: (value: Value) => Key,
|};

export class ReadAllAddUpdateDeleteStorageCache<
  Key,
  Value,
  Update,
> extends ReadAllStorageCache<Key, Value> {
  add: AddFunc<Value>;
  update: UpdateFunc<Value, Update>;
  delete: DeleteFunc<Key>;

  constructor(
    options: ReadAllAddUpdateDeleteStorageCacheOptions<Key, Value, Update>,
  ) {
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

type ReadAllAddStorageCacheOptions<Key, Value> = {|
  ...ReadAllStorageCacheOptions<Key, Value>,
  getKeyFromValue: (value: Value) => Key,
|};

export class ReadAllAddStorageCache<Key, Value> extends ReadAllStorageCache<
  Key,
  Value,
> {
  add: AddFunc<Value>;

  constructor(options: ReadAllAddStorageCacheOptions<Key, Value>) {
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

type BlockLikeKey = {|
  hashOrIndex: $PropertyType<Block, 'hash'> | $PropertyType<Block, 'index'>,
|};
type BlockLike = {
  +hash: $PropertyType<Block, 'hash'>,
  +index: $PropertyType<Block, 'index'>,
};

type BlockLikeStorageCacheOptions<Value: BlockLike> = {|
  ...BaseReadStorageCacheOptions<BlockLikeKey, Value, Value>,
|};

export class BlockLikeStorageCache<
  Value: BlockLike,
> extends BaseReadStorageCache<BlockLikeKey, Value, Value> {
  _create: (value: Value) => Value;
  _indexValues: { [index: string]: TrackedChange<BlockLikeKey, Value, Value> };

  constructor(options: BlockLikeStorageCacheOptions<Value>) {
    super({
      readStorage: options.readStorage,
      name: options.name,
      createAddChange: options.createAddChange,
    });
    this._indexValues = {};
  }

  async add(value: Value, force?: boolean): Promise<void> {
    if (!force) {
      const currentValue = await this.tryGet({ hashOrIndex: value.index });
      if (currentValue != null) {
        // TODO: Better error
        throw new Error('Attempted to add an already existing object.');
      }
    }

    const addValue = { type: 'add', addValue: value, value };
    this._values[common.uInt256ToString(value.hash)] = addValue;
    this._indexValues[`${value.index}`] = addValue;
  }

  _tryGetTracked(
    key: BlockLikeKey,
  ): ?TrackedChange<BlockLikeKey, Value, Value> {
    if (typeof key.hashOrIndex !== 'number') {
      return this._values[common.uInt256ToString(key.hashOrIndex)];
    }

    return this._indexValues[`${key.hashOrIndex}`];
  }
}

type OutputValue = {|
  hash: UInt256,
  index: number,
  output: Output,
|};

const getOutputValueKeyString = (key: OutputKey): string =>
  `${common.uInt256ToHex(key.hash)}:${key.index}`;

export class OutputStorageCache extends ReadStorageCache<
  OutputKey,
  OutputValue,
  Output,
> {
  add: AddFunc<OutputValue>;

  constructor(readStorage: ReadStorage<OutputKey, Output>) {
    super({
      readStorage,
      name: 'output',
      getKeyString: getOutputValueKeyString,
      createAddChange: (value: OutputValue) => ({ type: 'output', value }),
    });
    this.add = async (value: OutputValue, force?: boolean): Promise<void> => {
      const key = { hash: value.hash, index: value.index };

      if (!force) {
        const currentValue = await this.tryGet(key);
        if (currentValue != null) {
          // TODO: Better error
          throw new Error(
            `Attempted to add an already existing object for key ` +
              `${this._name}:${this._getKeyString(key)}.`,
          );
        }
      }

      this._values[this._getKeyString(key)] = {
        type: 'add',
        addValue: value,
        value: value.output,
      };
    };
  }
}

type TrackedMetadataChange<AddValue, Value> =
  | {| type: 'add', addValue: AddValue, value: Value |}
  | {| type: 'delete' |};

type GetMetadataFunc<Value> = () => Promise<Value>;
type TryGetMetadataFunc<Value> = () => Promise<?Value>;

function createGetMetadata<Key, Value>({
  tryGetTracked,
  readStorage,
}: {|
  tryGetTracked: () => ?TrackedMetadataChange<*, Value>,
  readStorage: ReadMetadataStorage<Value>,
|}): GetFunc<Key, Value> {
  return async (): Promise<Value> => {
    const trackedChange = tryGetTracked();
    if (trackedChange != null) {
      // TODO: Better error
      if (trackedChange.type === 'delete') {
        throw new Error('Not found');
      }

      return trackedChange.value;
    }

    const value = await readStorage.get();
    return value;
  };
}

function createTryGetMetadata<Value>({
  tryGetTracked,
  readStorage,
}: {|
  tryGetTracked: () => ?TrackedMetadataChange<*, Value>,
  readStorage: ReadMetadataStorage<Value>,
|}): TryGetMetadataFunc<Value> {
  return async (): Promise<?Value> => {
    const trackedChange = tryGetTracked();
    if (trackedChange != null) {
      if (trackedChange.type === 'delete') {
        return null;
      }

      return trackedChange.value;
    }

    const value = await readStorage.tryGet();
    return value;
  };
}

type BaseReadMetadataStorageCacheOptions<AddValue, Value> = {|
  readStorage: ReadMetadataStorage<Value>,
  name: string,
  createAddChange: (value: AddValue) => AddChange,
  createDeleteChange?: () => DeleteChange,
  onAdd?: (value: AddValue) => Promise<void>,
|};

export class BaseReadMetadataStorageCache<AddValue, Value> {
  _readStorage: ReadMetadataStorage<Value>;
  _name: string;
  _createAddChange: (value: AddValue) => AddChange;
  _createDeleteChange: ?() => DeleteChange;
  _onAdd: ?(value: AddValue) => Promise<void>;
  _value: ?TrackedMetadataChange<AddValue, Value>;

  get: GetMetadataFunc<Value>;
  tryGet: TryGetMetadataFunc<Value>;

  constructor(options: BaseReadMetadataStorageCacheOptions<AddValue, Value>) {
    this._readStorage = options.readStorage;
    this._name = options.name;
    this._createAddChange = options.createAddChange;
    this._createDeleteChange = options.createDeleteChange;
    this._onAdd = options.onAdd;
    this._value = null;

    this.get = createGetMetadata({
      readStorage: this._readStorage,
      tryGetTracked: this._tryGetTracked.bind(this),
    });
    this.tryGet = createTryGetMetadata({
      readStorage: this._readStorage,
      tryGetTracked: this._tryGetTracked.bind(this),
    });
  }

  getChangeSet(): ChangeSet {
    const createDeleteChange = this._createDeleteChange;
    const value = this._value;
    if (value == null) {
      return [];
    }

    if (value.type === 'delete') {
      if (createDeleteChange == null) {
        // TODO: Make better
        throw new Error('Invalid delete');
      }

      return [{ type: 'delete', change: createDeleteChange() }];
    }

    return [{ type: 'add', change: this._createAddChange(value.addValue) }];
  }

  _tryGetTracked(): ?TrackedMetadataChange<AddValue, Value> {
    return this._value;
  }
}

class ReadMetadataStorageCache<
  AddValue,
  Value,
> extends BaseReadMetadataStorageCache<AddValue, Value> {}

function createAddMetadata<Value>({
  cache,
}: {|
  cache: ReadMetadataStorageCache<Value, Value>,
|}): AddFunc<Value> {
  return async (value: Value): Promise<void> => {
    if (cache._onAdd != null) {
      await cache._onAdd(value);
    }

    // eslint-disable-next-line
    cache._value = {
      type: 'add',
      addValue: value,
      value,
    };
  };
}

function createUpdateMetadata<Value, Update>({
  cache,
  update: updateFunc,
}: {|
  cache: ReadMetadataStorageCache<Value, Value>,
  update: (value: Value, update: Update) => Value,
|}): UpdateFunc<Value, Update> {
  return async (value: Value, update: Update): Promise<Value> => {
    const updatedValue = updateFunc(value, update);
    // eslint-disable-next-line
    cache._value = {
      type: 'add',
      addValue: updatedValue,
      value: updatedValue,
    };

    return updatedValue;
  };
}

type ReadAddUpdateMetadataStorageCacheOptions<Value, Update> = {|
  ...BaseReadMetadataStorageCacheOptions<Value, Value>,
  update: (value: Value, update: Update) => Value,
|};

export class ReadAddUpdateMetadataStorageCache<
  Value,
  Update,
> extends ReadMetadataStorageCache<Value, Value> {
  add: AddFunc<Value>;
  update: UpdateFunc<Value, Update>;

  constructor(
    options: ReadAddUpdateMetadataStorageCacheOptions<Value, Update>,
  ) {
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
