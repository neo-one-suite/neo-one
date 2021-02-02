import { common as clientCommon, crypto, Op, ScriptBuilder, UInt160, WitnessScopeModel } from '@neo-one/client-common';
import { Block, ConsensusData, Signer, Transaction, Witness } from '@neo-one/node-core';
import { BN } from 'bn.js';

export const GENERATION_AMOUNT: readonly number[] = [6, 5, 4, 3, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

export const GENERATION_AMOUNT_PRIVATE: readonly number[] = [8, 7, 6];
export const ISSUE_AMOUNT_PRIVATE = clientCommon.fixed8FromDecimal(58000000);
export const DECREMENT_INTERVAL = 2000000;
export const MILLISECONDS_PER_BLOCK = 15000;
export const MAX_TRANSACTION_PER_BLOCK = 500;

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

const getDeployNativeContracts = (messageMagic: number) => {
  const scriptBuilder = new ScriptBuilder();
  scriptBuilder.emitSysCall('Neo.Native.Deploy');
  const script = scriptBuilder.build();

  return new Transaction({
    version: 0,
    script,
    systemFee: new BN(0),
    networkFee: new BN(0),
    signers: [
      new Signer({
        account: crypto.hash160(Buffer.from([Op.PUSH1])),
        scopes: WitnessScopeModel.None,
      }),
    ],
    attributes: [],
    witnesses: [getDeployWitness()],
    validUntilBlock: 0,
    messageMagic,
  });
};

interface GetGenesisBlockOptions {
  readonly consensusAddress: UInt160;
  readonly messageMagic: number;
  readonly privateNet?: boolean;
}

const getGenesisBlock = ({ consensusAddress, messageMagic }: GetGenesisBlockOptions) =>
  new Block({
    previousHash: clientCommon.ZERO_UINT256,
    timestamp: new BN(Date.UTC(2016, 6, 15, 15, 8, 21)),
    index: 0,
    nextConsensus: consensusAddress,
    witness: getDeployWitness(),
    consensusData: new ConsensusData({
      primaryIndex: 0,
      nonce: new BN(2083236893),
    }),
    transactions: [getDeployNativeContracts(messageMagic)],
    messageMagic,
  });

export const common = ({ privateNet, consensusAddress, messageMagic }: Options) => ({
  genesisBlock: getGenesisBlock({
    consensusAddress,
    privateNet,
    messageMagic,
  }),
  decrementInterval: DECREMENT_INTERVAL,
  generationAmount: privateNet ? GENERATION_AMOUNT_PRIVATE : GENERATION_AMOUNT,
  millisecondsPerBlock: MILLISECONDS_PER_BLOCK,
  maxTransactionsPerBlock: MAX_TRANSACTION_PER_BLOCK,
  memoryPoolMaxTransactions: 50000,
});
