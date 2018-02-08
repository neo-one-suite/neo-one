/* @flow */
import {
  type AddChange,
  type Change,
  type DeleteChange,
} from '@neo-one/node-core';

import { keys } from '@neo-one/node-storage-common';

const convertAddChange = (changeIn: AddChange) => {
  const change = changeIn;
  switch (change.type) {
    case 'account':
      return [
        {
          type: 'add',
          model: 'account',
          key: keys.typeKeyToSerializeKeyString.account(change.value),
          value: change.value,
        },
      ];
    case 'accountUnclaimed':
      return [
        {
          type: 'add',
          model: 'accountUnclaimed',
          key: keys.typeKeyToSerializeKeyString.accountUnclaimed({
            hash: change.value.hash,
            input: change.value.input,
          }),
          value: change.value,
        },
      ];
    case 'accountUnspent':
      return [
        {
          type: 'add',
          model: 'accountUnspent',
          key: keys.typeKeyToSerializeKeyString.accountUnspent({
            hash: change.value.hash,
            input: change.value.input,
          }),
          value: change.value,
        },
      ];
    case 'action':
      return [
        {
          type: 'add',
          model: 'action',
          key: keys.typeKeyToSerializeKeyString.action({
            blockIndex: change.value.blockIndex,
            transactionIndex: change.value.transactionIndex,
            index: change.value.index,
          }),
          value: change.value,
        },
      ];
    case 'asset':
      return [
        {
          type: 'add',
          model: 'asset',
          key: keys.typeKeyToSerializeKeyString.asset(change.value),
          value: change.value,
        },
      ];
    case 'block':
      return [
        {
          type: 'add',
          model: 'block',
          key: keys.typeKeyToSerializeKeyString.block(change.value),
          value: change.value,
        },
        {
          type: 'add',
          model: 'block',
          key: `${change.value.index}`,
          value: change.value,
        },
      ];
    case 'blockSystemFee':
      return [
        {
          type: 'add',
          model: 'blockSystemFee',
          key: keys.typeKeyToSerializeKeyString.blockSystemFee(change.value),
          value: change.value,
        },
      ];
    case 'header':
      return [
        {
          type: 'add',
          model: 'header',
          key: keys.typeKeyToSerializeKeyString.header(change.value),
          value: change.value,
        },
        {
          type: 'add',
          model: 'header',
          key: `${change.value.index}`,
          value: change.value,
        },
      ];
    case 'transaction':
      return [
        {
          type: 'add',
          model: 'transaction',
          key: keys.typeKeyToSerializeKeyString.transaction(change.value),
          value: change.value,
        },
      ];
    case 'output':
      return [
        {
          type: 'add',
          model: 'output',
          key: keys.typeKeyToSerializeKeyString.output({
            hash: change.value.hash,
            index: change.value.index,
          }),
          value: change.value.output,
        },
      ];
    case 'transactionSpentCoins':
      return [
        {
          type: 'add',
          model: 'transactionSpentCoins',
          key: keys.typeKeyToSerializeKeyString.transactionSpentCoins(
            change.value,
          ),
          value: change.value,
        },
      ];
    case 'contract':
      return [
        {
          type: 'add',
          model: 'contract',
          key: keys.typeKeyToSerializeKeyString.contract(change.value),
          value: change.value,
        },
      ];
    case 'storageItem':
      return [
        {
          type: 'add',
          model: 'storageItem',
          key: keys.typeKeyToSerializeKeyString.storageItem({
            hash: change.value.hash,
            key: change.value.key,
          }),
          value: change.value,
        },
      ];
    case 'validator':
      return [
        {
          type: 'add',
          model: 'validator',
          key: keys.typeKeyToSerializeKeyString.validator({
            publicKey: change.value.publicKey,
          }),
          value: change.value,
        },
      ];
    case 'invocationData':
      return [
        {
          type: 'add',
          model: 'invocationData',
          key: keys.typeKeyToSerializeKeyString.invocationData(change.value),
          value: change.value,
        },
      ];
    case 'validatorsCount':
      return [
        {
          type: 'add',
          model: 'validatorsCount',
          key: keys.validatorsCountKey,
          value: change.value,
        },
      ];
    default:
      // eslint-disable-next-line
      (change.type: empty);
      throw new Error('For Flow');
  }
};

const convertDeleteChange = (change: DeleteChange) => {
  switch (change.type) {
    case 'account':
      return {
        type: 'delete',
        model: 'account',
        key: keys.typeKeyToSerializeKeyString.account(change.key),
      };
    case 'accountUnclaimed':
      return {
        type: 'delete',
        model: 'accountUnclaimed',
        key: keys.typeKeyToSerializeKeyString.accountUnclaimed(change.key),
      };
    case 'accountUnspent':
      return {
        type: 'delete',
        model: 'accountUnspent',
        key: keys.typeKeyToSerializeKeyString.accountUnclaimed(change.key),
      };
    case 'contract':
      return {
        type: 'delete',
        model: 'contract',
        key: keys.typeKeyToSerializeKeyString.contract(change.key),
      };
    case 'storageItem':
      return {
        type: 'delete',
        model: 'storageItem',
        key: keys.typeKeyToSerializeKeyString.storageItem(change.key),
      };
    case 'validator':
      return {
        type: 'delete',
        model: 'validator',
        key: keys.typeKeyToSerializeKeyString.validator(change.key),
      };
    default:
      // eslint-disable-next-line
      (change.type: empty);
      throw new Error('For Flow');
  }
};

export default (change: Change) => {
  if (change.type === 'add') {
    return convertAddChange(change.change);
  } else if (change.type === 'delete') {
    return [convertDeleteChange(change.change)];
  }

  // eslint-disable-next-line
  (change.type: empty);
  throw new Error('For Flow');
};
