/* @flow */
import BN from 'bn.js';
import {
  ASSET_TYPE,
  OPCODE_TO_BYTECODE,
  type ECPoint,
  type UInt160,
  Block,
  IssueTransaction,
  MinerTransaction,
  Output,
  RegisterTransaction,
  ScriptBuilder,
  Witness,
  common,
  crypto,
} from '@neo-one/core';

export const GENERATION_AMOUNT = [
  8,
  7,
  6,
  5,
  4,
  3,
  2,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
];
export const DECREMENT_INTERVAL = 2000000;
export const SECONDS_PER_BLOCK = 15;
export const MAX_TRANSACTION_PER_BLOCK = 500;

type Options = {|
  standbyValidators: Array<ECPoint>,
  utilityTokenAmount?: number,
  address?: UInt160,
|};

const ONE_HUNDRED_MILLION = common.fixed8FromDecimal(100000000);

const getGoverningToken = () => {
  const scriptBuilder = new ScriptBuilder();
  scriptBuilder.emitOp('PUSH1');
  const admin = crypto.toScriptHash(scriptBuilder.build());
  return new RegisterTransaction({
    asset: {
      type: ASSET_TYPE.GOVERNING_TOKEN,
      name:
        '[{"lang":"zh-CN","name":"小蚁股"},{"lang":"en","name":"AntShare"}]',
      amount: ONE_HUNDRED_MILLION,
      precision: 0,
      // TODO: Fix size calculation - should be 1 for infinite point
      owner: common.ECPOINT_INFINITY,
      admin,
    },
  });
};

const getUtilityToken = ({ amount: amountIn }: {| amount?: number |}) => {
  const scriptBuilder = new ScriptBuilder();
  scriptBuilder.emitOp('PUSH0');
  const amount =
    amountIn == null ? ONE_HUNDRED_MILLION : common.fixed8FromDecimal(amountIn);
  if (amount.lt(ONE_HUNDRED_MILLION)) {
    throw new Error('Amount must be greater than 100 million.');
  }

  const admin = crypto.toScriptHash(scriptBuilder.build());
  return new RegisterTransaction({
    asset: {
      type: ASSET_TYPE.UTILITY_TOKEN,
      name: '[{"lang":"zh-CN","name":"小蚁币"},{"lang":"en","name":"AntCoin"}]',
      amount,
      precision: 8,
      owner: common.ECPOINT_INFINITY,
      admin,
    },
  });
};

const getGenesisBlock = ({
  standbyValidators,
  governingToken,
  utilityToken,
  address: addressIn,
}: {|
  ...Options,
  governingToken: RegisterTransaction,
  utilityToken: RegisterTransaction,
  address?: UInt160,
|}) => {
  const address =
    addressIn == null
      ? crypto.toScriptHash(
          crypto.createMultiSignatureVerificationScript(
            standbyValidators.length / 2 + 1,
            standbyValidators,
          ),
        )
      : addressIn;
  return new Block({
    previousHash: common.ZERO_UINT256,
    timestamp: 1468595301,
    index: 0,
    consensusData: new BN(2083236893),
    nextConsensus: crypto.getConsensusAddress(standbyValidators),
    script: new Witness({
      invocation: Buffer.from([]),
      verification: Buffer.from([OPCODE_TO_BYTECODE.PUSH1]),
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
            verification: Buffer.from([OPCODE_TO_BYTECODE.PUSH1]),
          }),
        ],
      }),
      utilityToken.asset.amount.gt(ONE_HUNDRED_MILLION)
        ? new IssueTransaction({
            outputs: [
              new Output({
                asset: utilityToken.hash,
                value: utilityToken.asset.amount.sub(ONE_HUNDRED_MILLION),
                address,
              }),
            ],
            scripts: [
              new Witness({
                invocation: Buffer.from([]),
                verification: Buffer.from([OPCODE_TO_BYTECODE.PUSH0]),
              }),
            ],
          })
        : null,
    ].filter(Boolean),
  });
};

export default (optionsIn?: Options) => {
  const options = optionsIn || {};
  const governingToken = getGoverningToken();
  const utilityToken = getUtilityToken({ amount: options.utilityTokenAmount });
  return {
    genesisBlock: getGenesisBlock({
      standbyValidators: options.standbyValidators,
      governingToken,
      utilityToken,
      address: options.address,
    }),
    governingToken,
    utilityToken,
    decrementInterval: DECREMENT_INTERVAL,
    generationAmount: GENERATION_AMOUNT,
    secondsPerBlock: SECONDS_PER_BLOCK,
    maxTransactionsPerBlock: MAX_TRANSACTION_PER_BLOCK,
  };
};
