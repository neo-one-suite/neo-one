import { InvalidFormatError, UInt256 } from '@neo-one/client-common';
import { Nep17BalanceKey, Nep17TransferKey, StorageKey, StreamOptions } from '@neo-one/node-core';
import { BN } from 'bn.js';

export enum Prefix {
  Nep17Balance = 0xf8,
  Nep17TransferSent = 0xf9,
  Nep17TransferReceived = 0xfa,
  ApplicationLog = 0xfb, // Custom internal prefix. Can be changed
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

/* crude method but it does what we want it to do */
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

const createGetSearchRangeWithoutPrefix =
  () =>
  (lookupKey: Buffer, secondaryLookupKey?: Buffer): Required<StreamOptions> => {
    if (secondaryLookupKey) {
      return {
        gte: lookupKey,
        lte: secondaryLookupKey,
      };
    }
    const { gte: initGte, lte: initLte } = generateSearchRange(lookupKey);

    return {
      gte: initGte,
      lte: initLte,
    };
  };

const createStorageKey = (key: StorageKey) => key.serializeWire();

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

const getStorageSearchRange = createGetSearchRangeWithoutPrefix();

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
  createNep17BalanceKey,
  createNep17TransferSentKey,
  createNep17TransferReceivedKey,
  createApplicationLogKey,
  createStorageKey,
  getStorageSearchRange,
  getNep17BalanceSearchRange,
  getAllNep17BalanceSearchRange,
  getNep17TransferReceivedSearchRange,
  getNep17TransferSentSearchRange,
};
