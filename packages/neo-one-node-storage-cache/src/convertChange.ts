import { AddChange, Change, DeleteChange } from '@neo-one/node-core';
import { keys } from '@neo-one/node-storage-common';
import { utils } from '@neo-one/utils';

export type CacheChange =
  // tslint:disable-next-line no-any
  | { readonly type: 'add'; readonly model: string; readonly key: string; readonly value: any }
  | { readonly type: 'delete'; readonly model: string; readonly key: string };

const convertAddChange = (changeIn: AddChange): readonly CacheChange[] => {
  const change = changeIn;
  switch (change.type) {
    case 'account':
      return [
        {
          type: 'add',
          model: 'account',
          key: keys.typeKeyToSerializeKey.account(change.value),
          value: change.value,
        },
      ];

    case 'accountUnclaimed':
      return [
        {
          type: 'add',
          model: 'accountUnclaimed',
          key: keys.typeKeyToSerializeKey.accountUnclaimed({
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
          key: keys.typeKeyToSerializeKey.accountUnspent({
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
          key: keys.typeKeyToSerializeKey.action({
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
          key: keys.typeKeyToSerializeKey.asset(change.value),
          value: change.value,
        },
      ];

    case 'block':
      return [
        {
          type: 'add',
          model: 'block',
          key: keys.typeKeyToSerializeKey.block(change.value),
          value: change.value,
        },

        {
          type: 'add',
          model: 'block',
          key: `${change.value.index}`,
          value: change.value,
        },
      ];

    case 'blockData':
      return [
        {
          type: 'add',
          model: 'blockData',
          key: keys.typeKeyToSerializeKey.blockData(change.value),
          value: change.value,
        },
      ];

    case 'header':
      return [
        {
          type: 'add',
          model: 'header',
          key: keys.typeKeyToSerializeKey.header(change.value),
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
          key: keys.typeKeyToSerializeKey.transaction(change.value),
          value: change.value,
        },
      ];

    case 'output':
      return [
        {
          type: 'add',
          model: 'output',
          key: keys.typeKeyToSerializeKey.output({
            hash: change.value.hash,
            index: change.value.index,
          }),

          value: change.value.output,
        },
      ];

    case 'transactionData':
      return [
        {
          type: 'add',
          model: 'transactionData',
          key: keys.typeKeyToSerializeKey.transactionData(change.value),
          value: change.value,
        },
      ];

    case 'contract':
      return [
        {
          type: 'add',
          model: 'contract',
          key: keys.typeKeyToSerializeKey.contract(change.value),
          value: change.value,
        },
      ];

    case 'storageItem':
      return [
        {
          type: 'add',
          model: 'storageItem',
          key: keys.typeKeyToSerializeKey.storageItem({
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
          key: keys.typeKeyToSerializeKey.validator({
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
          key: keys.typeKeyToSerializeKey.invocationData(change.value),
          value: change.value,
        },
      ];

    case 'validatorsCount':
      return [
        {
          type: 'add',
          model: 'validatorsCount',
          key: keys.validatorsCountKey.toString(),
          value: change.value,
        },
      ];

    default:
      utils.assertNever(change);
      throw new Error('For TS');
  }
};

const convertDeleteChange = (change: DeleteChange): CacheChange => {
  switch (change.type) {
    case 'account':
      return {
        type: 'delete',
        model: 'account',
        key: keys.typeKeyToSerializeKey.account(change.key),
      };

    case 'accountUnclaimed':
      return {
        type: 'delete',
        model: 'accountUnclaimed',
        key: keys.typeKeyToSerializeKey.accountUnclaimed(change.key),
      };

    case 'accountUnspent':
      return {
        type: 'delete',
        model: 'accountUnspent',
        key: keys.typeKeyToSerializeKey.accountUnclaimed(change.key),
      };

    case 'contract':
      return {
        type: 'delete',
        model: 'contract',
        key: keys.typeKeyToSerializeKey.contract(change.key),
      };

    case 'storageItem':
      return {
        type: 'delete',
        model: 'storageItem',
        key: keys.typeKeyToSerializeKey.storageItem(change.key),
      };

    case 'validator':
      return {
        type: 'delete',
        model: 'validator',
        key: keys.typeKeyToSerializeKey.validator(change.key),
      };

    default:
      utils.assertNever(change);
      throw new Error('For TS');
  }
};

export const convertChange = (change: Change) => {
  if (change.type === 'add') {
    return convertAddChange(change.change);
  }

  if (change.type === 'delete') {
    return [convertDeleteChange(change.change)];
  }

  utils.assertNever(change);
  throw new Error('For TS');
};
