import { common as clientCommon, crypto, Op, ScriptBuilder, UInt160 } from '@neo-one/client-common';
import {
  AssetType,
  Block,
  IssueTransaction,
  MinerTransaction,
  Output,
  RegisterTransaction,
  Witness,
} from '@neo-one/node-core';
import { utils } from '@neo-one/utils';
import BN from 'bn.js';

export const GENERATION_AMOUNT: readonly number[] = [8, 7, 6, 5, 4, 3, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

export const GENERATION_AMOUNT_PRIVATE: readonly number[] = [8, 7, 6];
export const ISSUE_AMOUNT_PRIVATE = clientCommon.fixed8FromDecimal(58000000);
export const DECREMENT_INTERVAL = 2000000;
export const SECONDS_PER_BLOCK = 15;
export const MAX_TRANSACTION_PER_BLOCK = 500;

interface Options {
  readonly address: UInt160;
  readonly privateNet?: boolean;
  readonly consensusAddress: UInt160;
}

const ONE_HUNDRED_MILLION = clientCommon.fixed8FromDecimal(100000000);

const getGoverningToken = () => {
  const scriptBuilder = new ScriptBuilder();
  scriptBuilder.emitOp('PUSH1');
  const admin = crypto.toScriptHash(scriptBuilder.build());

  return new RegisterTransaction({
    asset: {
      type: AssetType.GoverningToken,
      name: '[{"lang":"zh-CN","name":"小蚁股"},{"lang":"en","name":"AntShare"}]',
      amount: ONE_HUNDRED_MILLION,
      precision: 0,
      owner: clientCommon.ECPOINT_INFINITY,
      admin,
    },
  });
};

const getUtilityToken = () => {
  const scriptBuilder = new ScriptBuilder();
  scriptBuilder.emitOp('PUSH0');
  const admin = crypto.toScriptHash(scriptBuilder.build());

  return new RegisterTransaction({
    asset: {
      type: AssetType.UtilityToken,
      name: '[{"lang":"zh-CN","name":"小蚁币"},{"lang":"en","name":"AntCoin"}]',
      amount: ONE_HUNDRED_MILLION,
      precision: 8,
      owner: clientCommon.ECPOINT_INFINITY,
      admin,
    },
  });
};

interface GensisBlockOptions {
  readonly privateNet?: boolean;
  readonly governingToken: RegisterTransaction;
  readonly utilityToken: RegisterTransaction;
  readonly address: UInt160;
  readonly consensusAddress: UInt160;
}

const getGenesisBlock = ({ privateNet, governingToken, utilityToken, address, consensusAddress }: GensisBlockOptions) =>
  new Block({
    previousHash: clientCommon.ZERO_UINT256,
    timestamp: 1468595301,
    index: 0,
    consensusData: new BN(2083236893),
    nextConsensus: consensusAddress,
    script: new Witness({
      invocation: Buffer.from([]),
      verification: Buffer.from([Op.PUSH1]),
    }),
    transactions: [
      new MinerTransaction({ nonce: 2083236893 }),
      governingToken,
      utilityToken,
      new IssueTransaction({
        outputs: [
          new Output({
            asset: governingToken.hash,
            value: governingToken.asset.amount,
            address,
          }),
        ],
        scripts: [
          new Witness({
            invocation: Buffer.from([]),
            verification: Buffer.from([Op.PUSH1]),
          }),
        ],
      }),
      privateNet
        ? new IssueTransaction({
            outputs: [
              new Output({
                asset: utilityToken.hash,
                value: ISSUE_AMOUNT_PRIVATE,
                address,
              }),
            ],

            scripts: [
              new Witness({
                invocation: Buffer.from([]),
                verification: Buffer.from([Op.PUSH0]),
              }),
            ],
          })
        : undefined,
    ].filter(utils.notNull),
  });

export const common = ({ privateNet, address, consensusAddress }: Options) => {
  const utilityToken = getUtilityToken();
  const governingToken = getGoverningToken();

  return {
    genesisBlock: getGenesisBlock({
      privateNet,
      governingToken,
      utilityToken,
      address,
      consensusAddress,
    }),
    governingToken,
    utilityToken,
    decrementInterval: DECREMENT_INTERVAL,
    generationAmount: privateNet ? GENERATION_AMOUNT_PRIVATE : GENERATION_AMOUNT,
    secondsPerBlock: SECONDS_PER_BLOCK,
    maxTransactionsPerBlock: MAX_TRANSACTION_PER_BLOCK,
    memPoolSize: 50000,
  };
};
