import { common as clientCommon, Op, UInt160 } from '@neo-one/client-common';
import { Block, Header, Witness } from '@neo-one/node-core';
import { BN } from 'bn.js';

export const GENERATION_AMOUNT: readonly number[] = [6, 5, 4, 3, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

export const GENERATION_AMOUNT_PRIVATE: readonly number[] = [8, 7, 6];
export const ISSUE_AMOUNT_PRIVATE = clientCommon.fixed8FromDecimal(58000000);
export const DECREMENT_INTERVAL = 2000000;
export const MILLISECONDS_PER_BLOCK = 15000;
export const MEMORY_POOL_MAX_TRANSACTIONS = 50000;
export const MAX_TRACEABLE_BLOCKS = 2102400;
export const MAX_TRANSACTION_PER_BLOCK = 512;
export const MAX_BLOCK_SIZE = 262144;
export const MAX_BLOCK_SYSTEM_FEE = new BN(900000000000);
export const NATIVE_UPDATE_HISTORY = {
  CryptoLib: [0],
  GasToken: [0],
  LedgerContract: [0],
  NameService: [0],
  NeoToken: [0],
  OracleContract: [0],
  PolicyContract: [0],
  StdLib: [0],
  RoleManagement: [0],
};

interface Options {
  readonly privateNet?: boolean;
  readonly consensusAddress: UInt160;
  readonly messageMagic: number;
}

const getDeployWitness = () =>
  new Witness({
    invocation: Buffer.from([]),
    verification: Buffer.from([Op.PUSH1]),
  });

interface GetGenesisBlockOptions {
  readonly consensusAddress: UInt160;
  readonly messageMagic: number;
}

const getGenesisBlock = ({ consensusAddress, messageMagic }: GetGenesisBlockOptions) =>
  new Block({
    header: new Header({
      previousHash: clientCommon.ZERO_UINT256,
      merkleRoot: clientCommon.ZERO_UINT256,
      timestamp: new BN(Date.UTC(2016, 6, 15, 15, 8, 21)),
      index: 0,
      primaryIndex: 0,
      nextConsensus: consensusAddress,
      witness: getDeployWitness(),
      messageMagic,
    }),
    transactions: [],
  });

export const common = ({ privateNet, consensusAddress, messageMagic }: Options) => ({
  genesisBlock: getGenesisBlock({
    consensusAddress,
    messageMagic,
  }),
  decrementInterval: DECREMENT_INTERVAL,
  generationAmount: privateNet ? GENERATION_AMOUNT_PRIVATE : GENERATION_AMOUNT,
  millisecondsPerBlock: MILLISECONDS_PER_BLOCK,
  maxTransactionsPerBlock: MAX_TRANSACTION_PER_BLOCK,
  memoryPoolMaxTransactions: MEMORY_POOL_MAX_TRANSACTIONS,
  maxBlockSize: MAX_BLOCK_SIZE,
  maxBlockSystemFee: MAX_BLOCK_SYSTEM_FEE,
  nativeUpdateHistory: NATIVE_UPDATE_HISTORY,
  maxTraceableBlocks: MAX_TRACEABLE_BLOCKS,
});
