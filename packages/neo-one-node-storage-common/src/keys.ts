import { common, UInt160, UInt256 } from '@neo-one/client-common';
import {
  AccountInputKey,
  AccountInputsKey,
  ActionKey,
  ActionsKey,
  OutputKey,
  StorageItemKey,
  StorageItemsKey,
  ValidatorKey,
} from '@neo-one/node-core';
import { utils } from '@neo-one/utils';
import { BN } from 'bn.js';

const DELIMITER = '\x00';
const createPrefix = (value: string) => `${value}${DELIMITER}`;
const MAX_CHAR = '\xff';
const createMax = (value: string) => `${value}${MAX_CHAR}`;

const accountKeyPrefix = createPrefix('0');
const accountUnclaimedKeyPrefix = createPrefix('1');
const accountUnspentKeyPrefix = createPrefix('2');
const actionKeyPrefix = createPrefix('3');
const assetKeyPrefix = createPrefix('4');
const blockKeyPrefix = createPrefix('5');
const blockDataKeyPrefix = createPrefix('6');
const headerKeyPrefix = createPrefix('7');
const headerHashKeyPrefix = createPrefix('8');
const transactionKeyPrefix = createPrefix('9');
const outputKeyPrefix = createPrefix('a');
const transactionDataKeyPrefix = createPrefix('b');
const contractKeyPrefix = createPrefix('c');
const storageItemKeyPrefix = createPrefix('d');
const validatorKeyPrefix = createPrefix('e');
const invocationDataKeyPrefix = createPrefix('f');
const settingsPrefix = createPrefix('g');
const validatorsCountKey = createPrefix('h');

const serializeHeaderIndexHashKey = (index: number) => `${headerHashKeyPrefix}${index}`;

const maxHeaderHashKey = `${settingsPrefix}0`;
const maxBlockHashKey = `${settingsPrefix}1`;

const createSerializeAccountInputKey = (prefix: string) => ({ hash, input }: AccountInputKey): string =>
  `${prefix}${common.uInt160ToString(hash)}${common.uInt256ToString(input.hash)}${input.index}`;
const createGetAccountInputKeyMin = (prefix: string) => ({ hash }: AccountInputsKey): string =>
  `${prefix}${common.uInt160ToString(hash)}`;
const createGetAccountInputKeyMax = (prefix: string) => ({ hash }: AccountInputsKey): string =>
  createMax(`${prefix}${common.uInt160ToString(hash)}`);

const getAccountUnclaimedKeyMin = createGetAccountInputKeyMin(accountUnclaimedKeyPrefix);
const getAccountUnclaimedKeyMax = createGetAccountInputKeyMax(accountUnclaimedKeyPrefix);

const getAccountUnspentKeyMin = createGetAccountInputKeyMin(accountUnspentKeyPrefix);
const getAccountUnspentKeyMax = createGetAccountInputKeyMax(accountUnspentKeyPrefix);

const serializeStorageItemKey = ({ hash, key }: StorageItemKey): string =>
  `${storageItemKeyPrefix}${common.uInt160ToString(hash)}${key.toString('hex')}`;
const getStorageItemKeyMin = ({ hash, prefix }: StorageItemsKey): string =>
  [
    storageItemKeyPrefix,
    hash === undefined ? undefined : common.uInt160ToString(hash),
    prefix === undefined ? undefined : prefix.toString('hex'),
  ]
    .filter(utils.notNull)
    .join('');
const getStorageItemKeyMax = (key: StorageItemsKey): string => createMax(getStorageItemKeyMin(key));

const serializeUInt64 = (value: BN) => value.toString(10, 8);

const serializeActionKey = ({ index }: ActionKey): string => `${actionKeyPrefix}${serializeUInt64(index)}`;
const getActionKeyMin = ({ indexStart }: ActionsKey): string =>
  [actionKeyPrefix, indexStart === undefined ? undefined : serializeUInt64(indexStart)].filter(utils.notNull).join('');
const getActionKeyMax = ({ indexStop }: ActionsKey): string =>
  createMax(
    [actionKeyPrefix, indexStop === undefined ? undefined : serializeUInt64(indexStop)].filter(utils.notNull).join(''),
  );

const serializeValidatorKey = ({ publicKey }: ValidatorKey): string =>
  `${validatorKeyPrefix}${common.ecPointToString(publicKey)}`;
const validatorMinKey = validatorKeyPrefix;
const validatorMaxKey = createMax(validatorKeyPrefix);

const serializeUInt160Key = ({ hash }: { readonly hash: UInt160 }): string => common.uInt160ToString(hash);
const serializeUInt256Key = ({ hash }: { readonly hash: UInt256 }): string => common.uInt256ToString(hash);

const createSerializeUInt160Key = (prefix: string) => (input: { readonly hash: UInt160 }): string =>
  `${prefix}${serializeUInt160Key(input)}`;
const createSerializeUInt256Key = (prefix: string) => (input: { readonly hash: UInt256 }): string =>
  `${prefix}${serializeUInt256Key(input)}`;

const accountMinKey = accountKeyPrefix;
const accountMaxKey = createMax(accountKeyPrefix);

const serializeOutputKey = ({ index, hash }: OutputKey): string =>
  `${outputKeyPrefix}${common.uInt256ToString(hash)}${index}`;

const typeKeyToSerializeKey = {
  account: createSerializeUInt160Key(accountKeyPrefix),
  accountUnclaimed: createSerializeAccountInputKey(accountUnclaimedKeyPrefix),
  accountUnspent: createSerializeAccountInputKey(accountUnspentKeyPrefix),
  action: serializeActionKey,
  asset: createSerializeUInt256Key(assetKeyPrefix),
  block: createSerializeUInt256Key(blockKeyPrefix),
  blockData: createSerializeUInt256Key(blockDataKeyPrefix),
  header: createSerializeUInt256Key(headerKeyPrefix),
  transaction: createSerializeUInt256Key(transactionKeyPrefix),
  output: serializeOutputKey,
  transactionData: createSerializeUInt256Key(transactionDataKeyPrefix),
  contract: createSerializeUInt160Key(contractKeyPrefix),
  storageItem: serializeStorageItemKey,
  validator: serializeValidatorKey,
  invocationData: createSerializeUInt256Key(invocationDataKeyPrefix),
};

export const keys = {
  validatorsCountKey,
  serializeHeaderIndexHashKey,
  maxHeaderHashKey,
  maxBlockHashKey,
  getAccountUnclaimedKeyMin,
  getAccountUnclaimedKeyMax,
  getAccountUnspentKeyMin,
  getAccountUnspentKeyMax,
  getStorageItemKeyMin,
  getStorageItemKeyMax,
  serializeActionKey,
  getActionKeyMin,
  getActionKeyMax,
  validatorMinKey,
  validatorMaxKey,
  accountMinKey,
  accountMaxKey,
  typeKeyToSerializeKey,
};
