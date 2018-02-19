/* @flow */
import {
  type OutputKey,
  type ActionKey,
  type ActionsKey,
  type StorageItemKey,
  type StorageItemsKey,
  type UInt160,
  type UInt256,
  type ValidatorKey,
  common,
} from '@neo-one/client-core';
import {
  type AccountInputKey,
  type AccountInputsKey,
} from '@neo-one/node-core';

import bytewise from 'bytewise';

const accountKeyPrefix = 'account';
const accountUnclaimedKeyPrefix = 'accountUnclaimed';
const accountUnspentKeyPrefix = 'accountUnspent';
const actionKeyPrefix = 'action';
const assetKeyPrefix = 'asset';
const blockKeyPrefix = 'block';
const blockSystemFeeKeyPrefix = 'blockSystemFee';
const headerKeyPrefix = 'header';
const headerHashKeyPrefix = 'header-index';
const transactionKeyPrefix = 'transaction';
const outputKeyPrefix = 'output';
const transactionSpentCoinsKeyPrefix = 'transactionSpentCoins';
const contractKeyPrefix = 'contract';
const storageItemKeyPrefix = 'storageItem';
const validatorKeyPrefix = 'validator';
const invocationDataKeyPrefix = 'invocationData';
const settingsPrefix = 'settings';
export const validatorsCountKeyString = 'validatorsCount';
export const validatorsCountKey = bytewise.encode([validatorsCountKeyString]);

export const serializeHeaderIndexHashKey = (index: number): Buffer =>
  bytewise.encode([headerHashKeyPrefix, index]);
export const serializeHeaderIndexHashKeyString = (index: number): string =>
  `${headerHashKeyPrefix}:${index}`;

export const maxHeaderHashKey = (bytewise.encode([
  settingsPrefix,
  'max-header-hash',
]): Buffer);
export const maxBlockHashKey = (bytewise.encode([
  settingsPrefix,
  'max-block-hash',
]): Buffer);

const createSerializeAccountInputKey = (prefix: string) => ({
  hash,
  input,
}: AccountInputKey): Buffer =>
  bytewise.encode([
    prefix,
    common.uInt160ToBuffer(hash),
    common.uInt256ToBuffer(input.hash),
    input.index,
  ]);
const createSerializeAccountInputKeyString = (prefix: string) => ({
  hash,
  input,
}: AccountInputKey): string =>
  `${prefix}:` +
  `${common.uInt160ToString(hash)}:` +
  `${common.uInt256ToString(input.hash)}:` +
  `${input.index}`;
const createGetAccountInputKeyMin = (prefix: string) => ({
  hash,
}: AccountInputsKey): Buffer =>
  bytewise.encode(
    bytewise.sorts.array.bound.lower([prefix, common.uInt160ToBuffer(hash)]),
  );
const createGetAccountInputKeyMax = (prefix: string) => ({
  hash,
}: AccountInputsKey): Buffer =>
  bytewise.encode(
    bytewise.sorts.array.bound.upper([prefix, common.uInt160ToBuffer(hash)]),
  );
export const getAccountUnclaimedKeyMin = createGetAccountInputKeyMin(
  accountUnclaimedKeyPrefix,
);
export const getAccountUnclaimedKeyMax = createGetAccountInputKeyMax(
  accountUnclaimedKeyPrefix,
);
export const getAccountUnspentKeyMin = createGetAccountInputKeyMin(
  accountUnspentKeyPrefix,
);
export const getAccountUnspentKeyMax = createGetAccountInputKeyMax(
  accountUnspentKeyPrefix,
);

const serializeStorageItemKey = ({ hash, key }: StorageItemKey): Buffer =>
  bytewise.encode([storageItemKeyPrefix, common.uInt160ToBuffer(hash), key]);
const serializeStorageItemKeyString = ({ hash, key }: StorageItemKey): string =>
  `${storageItemKeyPrefix}:` +
  `${common.uInt160ToString(hash)}:` +
  `${key.toString('hex')}`;
export const getStorageItemKeyMin = ({
  hash,
  prefix,
}: StorageItemsKey): Buffer => {
  if (hash == null) {
    return bytewise.encode(
      bytewise.sorts.array.bound.lower([storageItemKeyPrefix]),
    );
  }

  if (prefix == null) {
    return bytewise.encode(
      bytewise.sorts.array.bound.lower([
        storageItemKeyPrefix,
        common.uInt160ToBuffer(hash),
      ]),
    );
  }

  return bytewise.encode(
    bytewise.sorts.array.bound.lower([
      storageItemKeyPrefix,
      common.uInt160ToBuffer(hash),
      prefix,
    ]),
  );
};
export const getStorageItemKeyMax = ({
  hash,
  prefix,
}: StorageItemsKey): Buffer => {
  if (hash == null) {
    return bytewise.encode(
      bytewise.sorts.array.bound.upper([storageItemKeyPrefix]),
    );
  }

  if (prefix == null) {
    return bytewise.encode(
      bytewise.sorts.array.bound.upper([
        storageItemKeyPrefix,
        common.uInt160ToBuffer(hash),
      ]),
    );
  }

  return bytewise.encode(
    bytewise.sorts.array.bound.upper([
      storageItemKeyPrefix,
      common.uInt160ToBuffer(hash),
      prefix,
    ]),
  );
};

export const serializeActionKey = ({
  blockIndex,
  transactionIndex,
  index,
}: ActionKey): Buffer =>
  bytewise.encode([actionKeyPrefix, blockIndex, transactionIndex, index]);
export const serializeActionKeyString = ({
  blockIndex,
  transactionIndex,
  index,
}: ActionKey): string =>
  `${actionKeyPrefix}:` +
  `${blockIndex}:` +
  `${transactionIndex}:` +
  `${index}`;

export const getActionKeyMin = ({
  blockIndexStart,
  transactionIndexStart,
  indexStart,
}: ActionsKey): Buffer =>
  bytewise.encode(
    bytewise.sorts.array.bound.lower(
      [
        actionKeyPrefix,
        blockIndexStart,
        transactionIndexStart,
        indexStart,
      ].filter(value => value != null),
    ),
  );
export const getActionKeyMax = ({
  blockIndexStop,
  transactionIndexStop,
  indexStop,
}: ActionsKey): Buffer =>
  bytewise.encode(
    bytewise.sorts.array.bound.upper(
      [actionKeyPrefix, blockIndexStop, transactionIndexStop, indexStop].filter(
        value => value != null,
      ),
    ),
  );

const serializeValidatorKey = ({ publicKey }: ValidatorKey): Buffer =>
  bytewise.encode([validatorKeyPrefix, common.ecPointToBuffer(publicKey)]);
const serializeValidatorKeyString = ({ publicKey }: ValidatorKey): string =>
  `${validatorKeyPrefix}:${common.ecPointToString(publicKey)}`;
export const validatorMinKey = bytewise.encode(
  bytewise.sorts.array.bound.lower([validatorKeyPrefix]),
);
export const validatorMaxKey = bytewise.encode(
  bytewise.sorts.array.bound.upper([validatorKeyPrefix]),
);

const serializeUInt160Key = ({ hash }: { +hash: UInt160 }): Buffer =>
  common.uInt160ToBuffer(hash);
const serializeUInt256Key = ({ hash }: { +hash: UInt256 }): Buffer =>
  common.uInt256ToBuffer(hash);

const createSerializeUInt160Key = (prefix: string) => (input: {
  +hash: UInt160,
}): Buffer => bytewise.encode([prefix, serializeUInt160Key(input)]);
const createSerializeUInt256Key = (prefix: string) => (input: {
  +hash: UInt256,
}): Buffer => bytewise.encode([prefix, serializeUInt256Key(input)]);

const createSerializeUInt160KeyString = (prefix: string) => (input: {
  +hash: UInt160,
}): string => `${prefix}:${common.uInt160ToString(input.hash)}`;
const createSerializeUInt256KeyString = (prefix: string) => (input: {
  +hash: UInt256,
}): string => `${prefix}:${common.uInt256ToString(input.hash)}`;

export const accountMinKey = bytewise.encode(
  bytewise.sorts.array.bound.lower([accountKeyPrefix]),
);
export const accountMaxKey = bytewise.encode(
  bytewise.sorts.array.bound.upper([accountKeyPrefix]),
);

const serializeOutputKey = ({ index, hash }: OutputKey): Buffer =>
  bytewise.encode([outputKeyPrefix, serializeUInt256Key({ hash }), index]);
const serializeOutputKeyString = ({ index, hash }: OutputKey): string =>
  `${outputKeyPrefix}:${common.uInt256ToString(hash)}:${index}`;

export const typeKeyToSerializeKey = {
  account: createSerializeUInt160Key(accountKeyPrefix),
  accountUnclaimed: createSerializeAccountInputKey(accountUnclaimedKeyPrefix),
  accountUnspent: createSerializeAccountInputKey(accountUnspentKeyPrefix),
  action: serializeActionKey,
  asset: createSerializeUInt256Key(assetKeyPrefix),
  block: createSerializeUInt256Key(blockKeyPrefix),
  blockSystemFee: createSerializeUInt256Key(blockSystemFeeKeyPrefix),
  header: createSerializeUInt256Key(headerKeyPrefix),
  transaction: createSerializeUInt256Key(transactionKeyPrefix),
  output: serializeOutputKey,
  transactionSpentCoins: createSerializeUInt256Key(
    transactionSpentCoinsKeyPrefix,
  ),
  contract: createSerializeUInt160Key(contractKeyPrefix),
  storageItem: serializeStorageItemKey,
  validator: serializeValidatorKey,
  invocationData: createSerializeUInt256Key(invocationDataKeyPrefix),
};

export const typeKeyToSerializeKeyString = {
  account: createSerializeUInt160KeyString(accountKeyPrefix),
  accountUnclaimed: createSerializeAccountInputKeyString(
    accountUnclaimedKeyPrefix,
  ),
  accountUnspent: createSerializeAccountInputKeyString(accountUnspentKeyPrefix),
  action: serializeActionKeyString,
  asset: createSerializeUInt256KeyString(assetKeyPrefix),
  block: createSerializeUInt256KeyString(blockKeyPrefix),
  blockSystemFee: createSerializeUInt256KeyString(blockSystemFeeKeyPrefix),
  header: createSerializeUInt256KeyString(headerKeyPrefix),
  transaction: createSerializeUInt256KeyString(transactionKeyPrefix),
  output: serializeOutputKeyString,
  transactionSpentCoins: createSerializeUInt256KeyString(
    transactionSpentCoinsKeyPrefix,
  ),
  contract: createSerializeUInt160KeyString(contractKeyPrefix),
  storageItem: serializeStorageItemKeyString,
  validator: serializeValidatorKeyString,
  invocationData: createSerializeUInt256KeyString(invocationDataKeyPrefix),
};
