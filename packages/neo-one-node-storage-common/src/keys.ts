import { common, InvalidFormatError, UInt160, UInt256 } from '@neo-one/client-common';
import { BlockKey, Nep5BalanceKey, Nep5TransferKey, StorageKey, StreamOptions } from '@neo-one/node-core';
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
  Nep5Balance = 0xf8,
  Nep5TransferSent = 0xf9,
  Nep5TransferReceived = 0xfa,
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

const createNep5BalanceKey = getCreateKey<Nep5BalanceKey>({
  serializeKey: (key) => key.serializeWire(),
  prefix: Prefix.Nep5Balance,
});

const createNep5TransferSentKey = getCreateKey<Nep5TransferKey>({
  serializeKey: (key) => key.serializeWire(),
  prefix: Prefix.Nep5TransferSent,
});

const createNep5TransferReceivedKey = getCreateKey<Nep5TransferKey>({
  serializeKey: (key) => key.serializeWire(),
  prefix: Prefix.Nep5TransferReceived,
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

const getAllNep5BalanceSearchRange = {
  gte: Buffer.from([Prefix.Nep5Balance]),
  lte: Buffer.from([Prefix.Nep5TransferSent]),
};

const getNep5BalanceSearchRange = createGetSearchRange(Prefix.Nep5Balance);
const getNep5TransferReceivedSearchRange = createGetSearchRange(Prefix.Nep5TransferReceived);
const getNep5TransferSentSearchRange = createGetSearchRange(Prefix.Nep5TransferSent);

const createApplicationLogKey = getCreateKey<UInt256>({
  serializeKey: (key) => key,
  prefix: Prefix.ApplicationLog,
});

export const keys = {
  createBlockKey,
  createNep5BalanceKey,
  createNep5TransferSentKey,
  createNep5TransferReceivedKey,
  createApplicationLogKey,
  createTransactionKey,
  createContractKey,
  createStorageKey,
  getStorageSearchRange,
  getNep5BalanceSearchRange,
  getAllNep5BalanceSearchRange,
  getNep5TransferReceivedSearchRange,
  getNep5TransferSentSearchRange,
  createHeaderHashListKey,
  blockHashIndexKey,
  headerHashIndexKey,
  contractIDKey,
  consensusStateKey,
  minBlockKey,
  maxBlockKey,
};
