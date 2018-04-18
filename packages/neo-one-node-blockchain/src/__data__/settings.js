/* @flow */
import BN from 'bn.js';
import {
  type ECPoint,
  ASSET_TYPE,
  OPCODE_TO_BYTECODE,
  TRANSACTION_TYPE,
  Block,
  IssueTransaction,
  MinerTransaction,
  Output,
  RegisterTransaction,
  ScriptBuilder,
  Witness,
  common,
  crypto,
} from '@neo-one/client-core';

const GENERATION_AMOUNT = [
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
const DECREMENT_INTERVAL = 2000000;
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

const getUtilityToken = () => {
  const scriptBuilder = new ScriptBuilder();
  scriptBuilder.emitOp('PUSH0');
  const admin = crypto.toScriptHash(scriptBuilder.build());
  return new RegisterTransaction({
    asset: {
      type: ASSET_TYPE.UTILITY_TOKEN,
      name: '[{"lang":"zh-CN","name":"小蚁币"},{"lang":"en","name":"AntCoin"}]',
      amount: ONE_HUNDRED_MILLION,
      precision: 8,
      owner: common.ECPOINT_INFINITY,
      admin,
    },
  });
};

const governingToken = getGoverningToken();
const utilityToken = getUtilityToken();

const standbyValidators = ([
  '03b209fd4f53a7170ea4444e0cb0a6bb6a53c2bd016926989cf85f9b0fba17a70c',
  '02df48f60e8f3e01c48ff40b9b7f1310d7a8b2a193188befe1c2e3df740e895093',
  '03b8d9d5771d8f513aa0869b9cc8d50986403b78c6da36890638c3d46a5adce04a',
  '02ca0e27697b9c248f6f16e085fd0061e26f44da85b58ee835c110caa5ec3ba554',
  '024c7b7fb6c310fccf1ba33b082519d82964ea93868d676662d4a59ad548df0e7d',
  '02aaec38470f6aad0042c6e877cfd8087d2676b0f516fddd362801b9bd3936399e',
  '02486fd15702c4490a26703112a5cc1d0923fd697a33406bd5a1c00e0013b09a70',
].map(value => common.stringToECPoint(value)): Array<ECPoint>);
const address = crypto.toScriptHash(
  crypto.createMultiSignatureVerificationScript(
    standbyValidators.length / 2 + 1,
    standbyValidators,
  ),
);

export default {
  genesisBlock: new Block({
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
    ],
  }),
  governingToken,
  utilityToken,
  decrementInterval: DECREMENT_INTERVAL,
  generationAmount: GENERATION_AMOUNT,
  secondsPerBlock: 15,
  maxTransactionsPerBlock: 500,
  fees: {
    [TRANSACTION_TYPE.ENROLLMENT]: common.fixed8FromDecimal(1000),
    [TRANSACTION_TYPE.ISSUE]: common.fixed8FromDecimal(500),
    [TRANSACTION_TYPE.PUBLISH]: common.fixed8FromDecimal(500),
    [TRANSACTION_TYPE.REGISTER]: common.fixed8FromDecimal(10000),
  },
  registerValidatorFee: common.fixed8FromDecimal(1000),
  messageMagic: 7630401,
  addressVersion: common.NEO_ADDRESS_VERSION,
  privateKeyVersion: common.NEO_PRIVATE_KEY_VERSION,
  standbyValidators,
  vm: {
    storageContext: {
      v0: {
        index: 0,
      },
    },
  },
};
