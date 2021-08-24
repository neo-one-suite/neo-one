import { AddChange, Change, DeleteChange } from '@neo-one/node-core';
import { keys } from '@neo-one/node-storage-common';
import { utils } from '@neo-one/utils';
import type { AbstractBatch, DelBatch, PutBatch } from 'abstract-leveldown';
import { UnknownChangeTypeError, UnknownTypeError } from './errors';

const convertAddChange = (change: AddChange): readonly PutBatch[] => {
  switch (change.type) {
    case 'nep17Balance':
      return [
        {
          type: 'put',
          key: keys.createNep17BalanceKey(change.key),
          value: change.value.serializeWire(),
        },
      ];

    case 'nep17TransferReceived':
      return [
        {
          type: 'put',
          key: keys.createNep17TransferReceivedKey(change.key),
          value: change.value.serializeWire(),
        },
      ];

    case 'nep17TransferSent':
      return [
        {
          type: 'put',
          key: keys.createNep17TransferSentKey(change.key),
          value: change.value.serializeWire(),
        },
      ];

    case 'applicationLog':
      return [
        {
          type: 'put',
          key: keys.createApplicationLogKey(change.key),
          value: change.value.serializeWire(),
        },
      ];

    case 'storage':
      return [
        {
          type: 'put',
          key: keys.createStorageKey(change.key),
          value: change.value.serializeWire(),
        },
      ];

    case 'blockData':
      return [
        {
          type: 'put',
          key: keys.createBlockDataKey(change.key),
          value: change.value.serializeWire(),
        },
      ];

    case 'transactionData':
      return [
        {
          type: 'put',
          key: keys.createTransactionDataKey(change.key),
          value: change.value.serializeWire(),
        },
      ];

    case 'action':
      return [
        {
          type: 'put',
          key: keys.createActionKey(change.key),
          value: change.value.serializeWire(),
        },
      ];

    default:
      utils.assertNever(change);
      throw new UnknownTypeError();
  }
};

const convertDeleteChange = (change: DeleteChange): DelBatch => {
  switch (change.type) {
    case 'storage':
      return {
        type: 'del',
        key: keys.createStorageKey(change.key),
      };

    case 'nep17Balance':
      return {
        type: 'del',
        key: keys.createNep17BalanceKey(change.key),
      };

    default:
      utils.assertNever(change);
      throw new UnknownTypeError();
  }
};

export const convertChange = (change: Change): readonly AbstractBatch[] => {
  if (change.type === 'add') {
    return convertAddChange(change.change);
  }

  if (change.type === 'delete') {
    return [convertDeleteChange(change.change)];
  }

  utils.assertNever(change);
  throw new UnknownChangeTypeError();
};
