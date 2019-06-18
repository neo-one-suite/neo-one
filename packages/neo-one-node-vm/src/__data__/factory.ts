// tslint:disable no-any
import { common, ECPoint, InputModelAdd, OutputModelAdd, UInt160, UInt256 } from '@neo-one/client-common';
import {
  Account,
  AccountAdd,
  Asset,
  AssetAdd,
  Block,
  BlockBaseAdd,
  BufferAttribute,
  BufferAttributeAdd,
  ChangeViewConsensusMessage,
  ConsensusPayload,
  ConsensusPayloadAdd,
  Contract,
  ContractAdd,
  ECPointAttribute,
  ECPointAttributeAdd,
  Header,
  HeaderAdd,
  Input,
  Output,
  TransactionData,
  UInt160Attribute,
  UInt160AttributeAdd,
  UInt256Attribute,
  UInt256AttributeAdd,
  Validator,
  ValidatorAdd,
  Witness,
  WitnessAdd,
} from '@neo-one/node-core';
import BN from 'bn.js';
import _ from 'lodash';

const internalData: ReadonlyArray<{
  readonly version: number;
  readonly hash256: UInt256;
  readonly hash160: UInt160;
  readonly asset: UInt256;
  readonly address: UInt160;
  readonly script: Buffer;
  readonly merkleRoot: UInt256;
  readonly timestamp: number;
  readonly consensusData: BN;
  readonly nextConsensus: UInt160;
  readonly verification: Buffer;
  readonly invocation: Buffer;
  readonly publicKey: ECPoint;
}> = [
  {
    version: 1,
    hash160: common.asUInt160(Buffer.from('f3812db982f3b0089a21a278988efeec6a027b25', 'hex')),
    hash256: common.hexToUInt256('0x07ae9ba488514e014fdbf166108b038fe94c54dbaedebfb6e676504b2a32cb47'),
    asset: common.hexToUInt256('0xb50034d97ba8c836758de1124b6c77d38bc772abc9a8f22c85e7389014e75234'),
    address: common.asUInt160(Buffer.from('197ff6783d512a740d42f4cc4f5572955fa44c95', 'hex')),
    script: Buffer.from([0x01]),
    merkleRoot: common.hexToUInt256('0x823e4d905b88d042e5a4038668a0068e331b673d79ebc91e3c9ecc5828a28de4'),
    consensusData: new BN(1),
    timestamp: 0,
    nextConsensus: common.asUInt160(Buffer.from('197ff6783d512a740d42f4cc4f5572955fa44c95', 'hex')),
    verification: Buffer.from('asdf08asdfljawerlk', 'hex'),
    invocation: Buffer.from('savpoudfglkwerl;wqer', 'hex'),
    publicKey: common.bufferToECPoint(
      Buffer.from('02028a99826edc0c97d18e22b6932373d908d323aa7f92656a77ec26e8861699ef', 'hex'),
    ),
  },
  {
    version: 1,
    hash160: common.asUInt160(Buffer.from('197ff6783d512a740d42f4cc4f5572955fa44c95', 'hex')),
    hash256: common.hexToUInt256('0x9bf50b229d070a243ec43f9979e1922d8275cbe2676b811e614ef4c3271ab7a9'),
    asset: common.hexToUInt256('0x0621113df436c180a47b833a2814008dc4f332915b22253651593a40a342e0fb'),
    address: common.asUInt160(Buffer.from('f3812db982f3b0089a21a278988efeec6a027b25', 'hex')),
    script: Buffer.from([0x02]),
    merkleRoot: common.hexToUInt256('0x7e2a450ffecb98d95380185a7f099697e0679a501403ae453cd79d171b40cc5f'),
    consensusData: new BN(2),
    timestamp: 1,
    nextConsensus: common.asUInt160(Buffer.from('f3812db982f3b0089a21a278988efeec6a027b25', 'hex')),
    verification: Buffer.from('sfgjuioyrsfgvacsf', 'hex'),
    invocation: Buffer.from('4356wr6i8fdgdnbsd', 'hex'),
    publicKey: common.bufferToECPoint(
      Buffer.from('031d8e1630ce640966967bc6d95223d21f44304133003140c3b52004dc981349c9', 'hex'),
    ),
  },
  {
    version: 1,
    hash160: common.asUInt160(Buffer.from('197ff6783d512a740d42f4cc4f5572955fa44c95', 'hex')),
    hash256: common.hexToUInt256('0x963edfc071a8708711cc3ed842dc4a06b5357d7330b3df7d147e7c150580f29c'),
    asset: common.hexToUInt256('0x0621113df436c180a47b833a2814008dc4f332915b22253651593a40a342e0fb'),
    address: common.asUInt160(Buffer.from('f3812db982f3b0089a21a278988efeec6a027b25', 'hex')),
    script: Buffer.from([0x02]),
    merkleRoot: common.hexToUInt256('0x7e2a450ffecb98d95380185a7f099697e0679a501403ae453cd79d171b40cc5f'),
    consensusData: new BN(2),
    timestamp: 1,
    nextConsensus: common.asUInt160(Buffer.from('197ff6783d512a740d42f4cc4f5572955fa44c95', 'hex')),
    verification: Buffer.from('fgntyotfd', 'hex'),
    invocation: Buffer.from('ert7rsxdgfs', 'hex'),
    publicKey: common.bufferToECPoint(
      Buffer.from('02232ce8d2e2063dce0451131851d47421bfc4fc1da4db116fca5302c0756462fa', 'hex'),
    ),
  },
];

// tslint:disable:no-let
let index = 1;
const previousData = internalData[index - 1];
const currentData = internalData[index];
// tslint:enable:no-let

const incrementData = () => {
  if (index === internalData.length - 1) {
    index = 1;
  }
  index = index + 1;
};

const resetDataIndex = () => {
  index = 1;
};

const createAccount = (options: Partial<AccountAdd> = {}) =>
  new Account({
    version: currentData.version,
    hash: currentData.hash160,
    ...options,
  });

const createAsset = (options: Partial<AssetAdd> = {}) =>
  new Asset({
    hash: currentData.hash256,
    type: 0x60,
    name: 'test',
    amount: new BN(1),
    precision: 8,
    owner: createECPoint(0x20),
    admin: previousData.hash160,
    issuer: currentData.hash160,
    expiration: 20,
    ...options,
  });

const createBufferAttribute = (options: Partial<BufferAttributeAdd> = {}) =>
  new BufferAttribute({
    usage: 0x81,
    value: currentData.asset,
    ...options,
  });

const createBlock = (options: Partial<BlockBaseAdd> = {}) =>
  new Block({
    previousHash: previousData.hash256,
    merkleRoot: currentData.merkleRoot,
    timestamp: 0,
    index: 0,
    consensusData: new BN(3),
    nextConsensus: currentData.nextConsensus,
    transactions: [],
    script: createWitness(),
    hash: currentData.hash256,
    ...options,
  });

const createECPointAttribute = (options: Partial<ECPointAttributeAdd> = {}) =>
  new ECPointAttribute({
    usage: 0x02,
    value: createECPoint(),
    ...options,
  });

const createUInt160Attribute = (options: Partial<UInt160AttributeAdd> = {}) =>
  new UInt160Attribute({
    usage: 0x20,
    value: currentData.hash160,
    ...options,
  });

const createUInt256Attribute = (options: Partial<UInt256AttributeAdd> = {}) =>
  new UInt256Attribute({
    usage: 0x00,
    value: currentData.hash256,
    ...options,
  });

const createOutput = (options: Partial<OutputModelAdd> = {}) =>
  new Output({
    asset: currentData.asset,
    value: new BN(0),
    address: currentData.address,
    ...options,
  });

const createConsensusPayload = (options: Partial<ConsensusPayloadAdd> = {}) =>
  new ConsensusPayload({
    version: currentData.version,
    previousHash: currentData.hash256,
    blockIndex: index,
    validatorIndex: index + 10,
    consensusMessage: new ChangeViewConsensusMessage({
      newViewNumber: 5,
      viewNumber: 3,
    }),
    script: createWitness(),
    ...options,
  });

const createContract = (options: Partial<ContractAdd> = {}) =>
  new Contract({
    version: currentData.version,
    script: currentData.script,
    parameterList: [],
    returnType: 0x01,
    contractProperties: 0x01,
    name: 'test',
    codeVersion: '1.0',
    author: 'Herby Hind',
    email: 'HerbyHind@neotracker.io',
    description: 'test contract',
    ...options,
  });
const createECPoint = (byte?: number) =>
  common.asECPoint(Buffer.from(_.range(33).map(() => (byte === undefined ? 0x01 : byte))));

const createInput = (options: Partial<InputModelAdd> = {}) =>
  new Input({
    hash: currentData.asset,
    index,
    ...options,
  });

const createHeader = (options: Partial<HeaderAdd> = {}): Header =>
  new Header({
    previousHash: previousData.hash256,
    merkleRoot: currentData.merkleRoot,
    timestamp: currentData.timestamp,
    index,
    consensusData: currentData.consensusData,
    nextConsensus: currentData.nextConsensus,
    script: createWitness(),
    hash: currentData.hash256,
    ...options,
  });

const createUInt160 = () => currentData.hash160;
const createUInt256 = () => currentData.hash256;

const createValidator = (options: Partial<ValidatorAdd> = {}) =>
  new Validator({
    publicKey: currentData.publicKey,
    ...options,
  });

const createWitness = (options: Partial<WitnessAdd> = {}): Witness =>
  new Witness({
    verification: currentData.verification,
    invocation: currentData.invocation,
    ...options,
  });

const createTransactionData = ({
  version,
  hash = createUInt256(),
  blockHash = createUInt256(),
  startHeight = 0,
  index: indexIn = 1,
  globalIndex = new BN(1),
  endHeights,
  claimed,
}: {
  readonly version?: number;
  readonly hash?: UInt256;
  readonly blockHash?: UInt256;
  readonly startHeight?: number;
  readonly index?: number;
  readonly globalIndex?: BN;
  readonly endHeights?: any;
  readonly claimed?: any;
}) =>
  new TransactionData({
    version,
    hash,
    blockHash,
    startHeight,
    index: indexIn,
    globalIndex,
    endHeights,
    claimed,
  });

export const factory = {
  createAccount,
  createAsset,
  createBlock,
  createBufferAttribute,
  createConsensusPayload,
  createContract,
  createECPoint,
  createECPointAttribute,
  createHeader,
  createInput,
  createOutput,
  createUInt160,
  createUInt160Attribute,
  createUInt256,
  createUInt256Attribute,
  createValidator,
  createWitness,
  createTransactionData,
  incrementData,
  resetDataIndex,
};
