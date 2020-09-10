import { BinaryWriter, common, UInt160, UInt256 } from '@neo-one/client-common';
import { BlockKey, StorageKey } from '@neo-one/node-core';

enum Prefix {
  Block = 0x01,
  Transaction = 0x02,
  Contract = 0x50,
  Storage = 0x70,
  HeaderHashList = 0x80,
  CurrentBlock = 0xc0,
  CurrentHeader = 0xc1,
  ContractID = 0xc2,

  // NEO•ONE prefix, watch out for future collisions with https://github.com/neo-project/neo/blob/master/src/neo/Persistence/Prefixes.cs
  Settings = 0xdd,
}

const getCreateKey = <Key>({
  serializeKey,
  prefix,
}: {
  readonly serializeKey: (key: Key) => Buffer;
  readonly prefix: Prefix;
}) => (key: Key) => Buffer.concat([Buffer.from([prefix]), serializeKey(key)]);

const getMetadataKey = ({ prefix }: { readonly prefix: Prefix }) => Buffer.from([prefix]);

const serializeHeaderHashListKey = (key: number) => {
  const writer = new BinaryWriter();
  writer.writeUInt32LE(key);

  return writer.toBuffer();
};

const createBlockKey = getCreateKey<BlockKey>({
  serializeKey: ({ hashOrIndex }) => {
    if (typeof hashOrIndex === 'number') {
      // TODO: implement getting a block by its index
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

const minBlockKey = createBlockKey({ hashOrIndex: common.ZERO_UINT256 });
const maxBlockKey = createBlockKey({ hashOrIndex: common.MAX_UINT256 });

const minHeaderHashListKey = createHeaderHashListKey(0);
const maxHeaderHashListKey = createHeaderHashListKey(0xffffffff);

export const keys = {
  createBlockKey,
  createTransactionKey,
  createContractKey,
  createStorageKey,
  createHeaderHashListKey,
  blockHashIndexKey,
  headerHashIndexKey,
  contractIDKey,
  minBlockKey,
  maxBlockKey,
  minHeaderHashListKey,
  maxHeaderHashListKey,
};
