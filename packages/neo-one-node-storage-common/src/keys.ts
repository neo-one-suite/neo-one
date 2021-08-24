import { InvalidFormatError, UInt256 } from '@neo-one/client-common';
import {
  ActionKey,
  BlockDataKey,
  Nep17BalanceKey,
  Nep17TransferKey,
  StorageKey,
  StoragePrefix,
  StreamOptions,
  TransactionDataKey,
} from '@neo-one/node-core';
import { BN } from 'bn.js';

export enum Prefix {
  Nep17Balance = 0xf8,
  Nep17TransferSent = 0xf9,
  Nep17TransferReceived = 0xfa,
  // Custom internal prefixes. Can be changed
  ApplicationLog = 0xfb,
  BlockData = 0xfc,
  TransactionData = 0xfd,
  Action = 0xfe,
  Storage = StoragePrefix, // This byte is used in C# code as well
}

const getCreateKey = <Key>({
  serializeKey,
  prefix,
}: {
  readonly serializeKey: (key: Key) => Buffer;
  readonly prefix: Prefix;
}) => {
  const prefixKey = Buffer.from([prefix]);

  return (key: Key) => Buffer.concat([prefixKey, serializeKey(key)]);
};

/* Daniel Byrne: This is a crude method but it does what we want it to do */
const generateSearchRange = (lookupKey: Buffer): Required<StreamOptions> => {
  const asBN = new BN(lookupKey);
  const lte = asBN.addn(1).toBuffer();
  if (lte.length !== lookupKey.length) {
    throw new InvalidFormatError('Error generating storage lookup search range');
  }

  return {
    gte: lookupKey,
    lte,
  };
};

const createGetSearchRange = (prefix: Prefix) => {
  const bufferKey = Buffer.from([prefix]);

  return (lookupKey: Buffer, secondaryLookupKey?: Buffer): Required<StreamOptions> => {
    if (secondaryLookupKey) {
      return {
        gte: Buffer.concat([bufferKey, lookupKey]),
        lte: Buffer.concat([bufferKey, secondaryLookupKey]),
      };
    }
    const { gte: initGte, lte: initLte } = generateSearchRange(lookupKey);

    return {
      gte: Buffer.concat([bufferKey, initGte]),
      lte: Buffer.concat([bufferKey, initLte]),
    };
  };
};

// Storage is for anything that is also expected to be read from C# VM code. Basically all contract storage
// including native contracts. This prefix keeps contract/native storage separate from all our other blockchain
// storage
const createStorageKey = getCreateKey<StorageKey>({
  serializeKey: (key) => key.serializeWire(),
  prefix: Prefix.Storage,
});

const createNep17BalanceKey = getCreateKey<Nep17BalanceKey>({
  serializeKey: (key) => key.serializeWire(),
  prefix: Prefix.Nep17Balance,
});

const createNep17TransferSentKey = getCreateKey<Nep17TransferKey>({
  serializeKey: (key) => key.serializeWire(),
  prefix: Prefix.Nep17TransferSent,
});

const createNep17TransferReceivedKey = getCreateKey<Nep17TransferKey>({
  serializeKey: (key) => key.serializeWire(),
  prefix: Prefix.Nep17TransferReceived,
});

const createBlockDataKey = getCreateKey<BlockDataKey>({
  serializeKey: (key) => key.hash,
  prefix: Prefix.BlockData,
});

const createTransactionDataKey = getCreateKey<TransactionDataKey>({
  serializeKey: (key) => key.hash,
  prefix: Prefix.TransactionData,
});

const createActionKey = getCreateKey<ActionKey>({
  serializeKey: (key) => key.index.toBuffer(),
  prefix: Prefix.Action,
});

const getStorageSearchRange = createGetSearchRange(Prefix.Storage);

const getAllNep17BalanceSearchRange = {
  gte: Buffer.from([Prefix.Nep17Balance]),
  lte: Buffer.from([Prefix.Nep17TransferSent]),
};

const getNep17BalanceSearchRange = createGetSearchRange(Prefix.Nep17Balance);
const getNep17TransferReceivedSearchRange = createGetSearchRange(Prefix.Nep17TransferReceived);
const getNep17TransferSentSearchRange = createGetSearchRange(Prefix.Nep17TransferSent);

const getAllActionSearchRange = {
  gte: Buffer.from([Prefix.Action]),
  lte: Buffer.from([Prefix.Storage]),
};
const getActionSearchRange = createGetSearchRange(Prefix.Action);

const createApplicationLogKey = getCreateKey<UInt256>({
  serializeKey: (key) => key,
  prefix: Prefix.ApplicationLog,
});

export const keys = {
  createNep17BalanceKey,
  createNep17TransferSentKey,
  createNep17TransferReceivedKey,
  createApplicationLogKey,
  createStorageKey,
  createBlockDataKey,
  createTransactionDataKey,
  createActionKey,
  getStorageSearchRange,
  getNep17BalanceSearchRange,
  getAllNep17BalanceSearchRange,
  getNep17TransferReceivedSearchRange,
  getNep17TransferSentSearchRange,
  getActionSearchRange,
  getAllActionSearchRange,
};
