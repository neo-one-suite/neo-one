import { AddChange, Change, DeleteChange } from '@neo-one/node-core';
import { keys } from '@neo-one/node-storage-common';
import { utils } from '@neo-one/utils';
import type { AbstractBatch, DelBatch, PutBatch } from 'abstract-leveldown';
import { UnknownChangeTypeError, UnknownTypeError } from './errors';

/**
 * TODO: previously we had extra storage for things like `latestBlock`, etc
 * If we decide we need those back we'll need to add the logic back to here
 * like we did in 2.x, revisit this.
 */

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

    case 'block':
      return [
        {
          type: 'put',
          key: keys.createBlockKey(change.key),
          value: change.value.serializeWire(),
        },
      ];

    case 'transaction':
      return [
        {
          type: 'put',
          key: keys.createTransactionKey(change.key),
          value: change.value.serializeWire(),
        },
      ];

    // case 'contract':
    //   return [
    //     {
    //       type: 'put',
    //       key: keys.createContractKey(change.key),
    //       value: change.value._serializeWire(),
    //     },
    //   ];

    case 'storage':
      return [
        {
          type: 'put',
          key: keys.createStorageKey(change.key),
          value: change.value.serializeWire(),
        },
      ];

    case 'headerHashList':
      return [
        {
          type: 'put',
          key: keys.createHeaderHashListKey(change.key),
          value: change.value.serializeWire(),
        },
      ];

    case 'blockHashIndex':
      return [
        {
          type: 'put',
          key: keys.blockHashIndexKey,
          value: change.value.serializeWire(),
        },
      ];

    case 'headerHashIndex':
      return [
        {
          type: 'put',
          key: keys.headerHashIndexKey,
          value: change.value.serializeWire(),
        },
      ];

    // case 'contractID':
    //   return [
    //     {
    //       type: 'put',
    //       key: keys.contractIDKey,
    //       value: change.value.serializeWire(),
    //     },
    //   ];

    default:
      utils.assertNever(change);
      throw new UnknownTypeError();
  }
};

const convertDeleteChange = (change: DeleteChange): DelBatch => {
  switch (change.type) {
    // case 'contract':
    //   return {
    //     type: 'del',
    //     key: keys.createContractKey(change.key),
    //   };

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
