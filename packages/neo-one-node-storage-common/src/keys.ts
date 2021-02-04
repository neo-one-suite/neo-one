import { common, InvalidFormatError, UInt160, UInt256 } from '@neo-one/client-common';
import { BlockKey, Nep17BalanceKey, Nep17TransferKey, StorageKey, StreamOptions } from '@neo-one/node-core';
import { BN } from 'bn.js';

export enum Prefix {
  Block = 0x01,
  Transaction = 0x02,
  Contract = 0x50,
  Storage = 0x70,
  HeaderHashList = 0x80,
  CurrentBlock = 0xc0,
  CurrentHeader = 0xc1,
  ContractID = 0xc2,
  ConsensusState = 0xf4,
  Nep17Balance = 0xf8,
  Nep17TransferSent = 0xf9,
  Nep17TransferReceived = 0xfa,
  ApplicationLog = 0xfb, // Custom internal prefix. Can be changed.

  // NEO•ONE prefix, watch out for future collisions with https://github.com/neo-project/neo/blob/master/src/neo/Persistence/Prefixes.cs
  Settings = 0xdd,
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

const getMetadataKey = ({ prefix }: { readonly prefix: Prefix }) => Buffer.from([prefix]);

const serializeHeaderHashListKey = (key: number) => {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32LE(key);

  return buffer;
};

/* crude method but it does what we want it to do */
const generateSearchRange = (lookupKey: Buffer): Required<StreamOptions> => {
  const asBN = new BN(lookupKey);
  const lte = asBN.addn(1).toBuffer();
  if (lte.length !== lookupKey.length) {
    throw new InvalidFormatError('not sure how this happened');
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

const createBlockKey = getCreateKey<BlockKey>({
  serializeKey: ({ hashOrIndex }) => {
    if (typeof hashOrIndex === 'number') {
      throw new Error();
    }

    return hashOrIndex;
  },
  prefix: Prefix.Block,
});

const createTransactionKey = getCreateKey<UInt256>({
  serializeKey: (key) => key,
  prefix: Prefix.Transaction,
});

const createContractKey = getCreateKey<UInt160>({
  serializeKey: (key) => key,
  prefix: Prefix.Contract,
});

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

const createHeaderHashListKey = getCreateKey<number>({
  serializeKey: serializeHeaderHashListKey,
  prefix: Prefix.HeaderHashList,
});

const blockHashIndexKey = getMetadataKey({
  prefix: Prefix.CurrentBlock,
});

const headerHashIndexKey = getMetadataKey({
  prefix: Prefix.CurrentHeader,
});

const contractIDKey = getMetadataKey({
  prefix: Prefix.ContractID,
});

const consensusStateKey = getMetadataKey({
  prefix: Prefix.ConsensusState,
});

const minBlockKey = createBlockKey({ hashOrIndex: common.ZERO_UINT256 });
const maxBlockKey = createBlockKey({ hashOrIndex: common.MAX_UINT256 });

const getStorageSearchRange = createGetSearchRange(Prefix.Storage);

const getAllNep17BalanceSearchRange = {
  gte: Buffer.from([Prefix.Nep17Balance]),
  lte: Buffer.from([Prefix.Nep17TransferSent]),
};

const getNep17BalanceSearchRange = createGetSearchRange(Prefix.Nep17Balance);
const getNep17TransferReceivedSearchRange = createGetSearchRange(Prefix.Nep17TransferReceived);
const getNep17TransferSentSearchRange = createGetSearchRange(Prefix.Nep17TransferSent);

const createApplicationLogKey = getCreateKey<UInt256>({
  serializeKey: (key) => key,
  prefix: Prefix.ApplicationLog,
});

export const keys = {
  createBlockKey,
  createNep17BalanceKey,
  createNep17TransferSentKey,
  createNep17TransferReceivedKey,
  createApplicationLogKey,
  createTransactionKey,
  createContractKey,
  createStorageKey,
  getStorageSearchRange,
  getNep17BalanceSearchRange,
  getAllNep17BalanceSearchRange,
  getNep17TransferReceivedSearchRange,
  getNep17TransferSentSearchRange,
  createHeaderHashListKey,
  blockHashIndexKey,
  headerHashIndexKey,
  contractIDKey,
  consensusStateKey,
  minBlockKey,
  maxBlockKey,
};
