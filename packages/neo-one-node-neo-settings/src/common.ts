import {
  AssetType,
  Block,
  common as coreCommon,
  crypto,
  ECPoint,
  IssueTransaction,
  MinerTransaction,
  OPCODE_TO_BYTECODE,
  Output,
  RegisterTransaction,
  ScriptBuilder,
  UInt160,
  Witness,
} from '@neo-one/client-core';
import BN from 'bn.js';

export const GENERATION_AMOUNT: ReadonlyArray<number> = [
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

export const GENERATION_AMOUNT_PRIVATE: ReadonlyArray<number> = [8, 7, 6];
export const ISSUE_AMOUNT_PRIVATE = coreCommon.fixed8FromDecimal(58000000);
export const DECREMENT_INTERVAL = 2000000;
export const SECONDS_PER_BLOCK = 15;
export const MAX_TRANSACTION_PER_BLOCK = 500;

interface Options {
  readonly standbyValidators: ReadonlyArray<ECPoint>;
  readonly address?: UInt160;
  readonly privateNet?: boolean;
}

const ONE_HUNDRED_MILLION = coreCommon.fixed8FromDecimal(100000000);

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
      owner: coreCommon.ECPOINT_INFINITY,
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
      owner: coreCommon.ECPOINT_INFINITY,
      admin,
    },
  });
};

const getGenesisBlock = ({
  privateNet,
  standbyValidators,
  governingToken,
  utilityToken,
  address: addressIn,
}:
  | {
      readonly governingToken: RegisterTransaction;
      readonly utilityToken: RegisterTransaction;
      readonly address?: UInt160;
    }
  | Options) => {
  const address =
    addressIn === undefined
      ? crypto.toScriptHash(
          crypto.createMultiSignatureVerificationScript(standbyValidators.length / 2 + 1, standbyValidators),
        )
      : addressIn;

  return new Block({
    previousHash: coreCommon.ZERO_UINT256,
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
                verification: Buffer.from([OPCODE_TO_BYTECODE.PUSH0]),
              }),
            ],
          })
        : undefined,
    ].filter(Boolean),
  });
};

export const common = (optionsIn?: Options) => {
  const options = optionsIn || ({} as any);
  const governingToken = getGoverningToken();
  const utilityToken = getUtilityToken();

  return {
    genesisBlock: getGenesisBlock({
      privateNet: options.privateNet,
      standbyValidators: options.standbyValidators,
      governingToken,
      utilityToken,
      address: options.address,
    }),

    governingToken,
    utilityToken,
    decrementInterval: DECREMENT_INTERVAL,
    generationAmount: options.privateNet ? GENERATION_AMOUNT_PRIVATE : GENERATION_AMOUNT,
    secondsPerBlock: SECONDS_PER_BLOCK,
    maxTransactionsPerBlock: MAX_TRANSACTION_PER_BLOCK,
    memPoolSize: 50000,
  };
};
