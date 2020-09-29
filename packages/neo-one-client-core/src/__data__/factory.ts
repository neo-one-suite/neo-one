// tslint:disable deprecation
import {
  ActionBaseJSON,
  AnyContractParameterJSON,
  ArrayContractParameterJSON,
  AttributeJSON,
  Block,
  BlockJSON,
  BooleanContractParameter,
  BooleanContractParameterJSON,
  ByteArrayContractParameterJSON,
  CallReceiptJSON,
  common,
  ConfirmedTransaction,
  Contract,
  ContractABI,
  ContractABIJSON,
  ContractJSON,
  ContractManifestJSON,
  ForwardValue,
  Hash160ABIParameter,
  Hash160ContractParameter,
  Hash160ContractParameterJSON,
  Hash256ContractParameterJSON,
  Header,
  HeaderJSON,
  IntegerABIParameter,
  IntegerABIReturn,
  IntegerContractParameter,
  IntegerContractParameterJSON,
  InteropInterfaceContractParameterJSON,
  InvocationDataJSON,
  LogActionJSON,
  MapContractParameterJSON,
  NetworkSettings,
  NetworkSettingsJSON,
  NotificationActionJSON,
  Peer,
  PublicKeyContractParameterJSON,
  RawActionBase,
  RawCallReceipt,
  RawInvocationData,
  RawInvocationResultErrorJSON,
  RawInvocationResultSuccessJSON,
  RawInvokeReceipt,
  RawLog,
  RawNotification,
  RawTransactionResultError,
  RawTransactionResultSuccess,
  SignatureContractParameterJSON,
  SmartContractDefinition,
  StorageItemJSON,
  StringABIParameter,
  StringABIReturn,
  StringContractParameter,
  StringContractParameterJSON,
  Transaction,
  TransactionJSON,
  TransactionModel,
  TransactionModelAdd,
  TransactionReceipt,
  TransactionResult,
  TransactionResultError,
  TransactionResultErrorJSON,
  TransactionResultSuccess,
  TransactionResultSuccessJSON,
  TransactionWithInvocationDataJSON,
  Transfer,
  UserAccount,
  UserAccountID,
  VerifyScriptResultJSON,
  VerifyTransactionResultJSON,
  VoidContractParameterJSON,
  Witness,
  WitnessJSON,
  WitnessModel,
} from '@neo-one/client-common';
import BigNumber from 'bignumber.js';
import { BN } from 'bn.js';
import { ContractEventDescriptor, ContractMethodDescriptor } from '../../../neo-one-node-core/src/manifest';
import { Hash256 } from '../Hash256';
import * as nep5 from '../nep5';
import { LockedWallet, UnlockedWallet } from '../user';
import { data } from './data';
import { keys } from './keys';

const createContractABIJSON = (options: Partial<ContractABIJSON> = {}): ContractABIJSON => ({
  hash: keys[0].scriptHashString,
  methods: [], // TODO
  events: [], // TODO
  ...options,
  // parameters: ['Hash160', 'ByteArray'],
  // returntype: 'ByteArray',
});

const createManifestJSON = (options: Partial<ContractManifestJSON> = {}): ContractManifestJSON => {
  const { abi, features, ...optionsIn } = options;

  return {
    hash: keys[0].scriptHashString,
    hashHex: keys[0].scriptHashString,
    abi: createContractABIJSON(abi),
    groups: [], // TODO
    permissions: [], // TODO
    trusts: '*',
    safeMethods: '*',
    features: {
      storage: true,
      payable: true,
      ...features,
    },
    supportedStandards: [], // TODO
    ...optionsIn,
  };
};

const createContractJSON = (options: Partial<ContractJSON> = {}): ContractJSON => {
  const { manifest, ...optionsIn } = options;

  return {
    id: 0,
    script: data.buffers.b,
    manifest: createManifestJSON(manifest),
    hasStorage: true,
    payable: true,
    ...optionsIn,
  };
};

const createActionBaseJSON = (options: Partial<ActionBaseJSON> = {}): ActionBaseJSON => ({
  version: 0,
  index: '10',
  scriptHash: keys[0].scriptHashString,
  ...options,
});

const createNotificationActionJSON = (options: Partial<NotificationActionJSON> = {}): NotificationActionJSON => ({
  ...createActionBaseJSON(),
  type: 'Notification',
  args: [createIntegerContractParameterJSON()],
  ...options,
});

const createLogActionJSON = (options: Partial<LogActionJSON> = {}): LogActionJSON => ({
  ...createActionBaseJSON(),
  type: 'Log',
  message: 'Hello World',
  ...options,
});

const createHighPriorityAttributeJSON = (options: Partial<AttributeJSON> = {}): AttributeJSON => ({
  type: 'HighPriority',
  ...options,
});

const createWitnessJSON = (options: Partial<WitnessJSON> = {}): WitnessJSON => ({
  invocation: data.buffers.a,
  verification: data.buffers.b,
  ...options,
});

const createTransactionJSON = (options: Partial<TransactionJSON> = {}): TransactionJSON => ({
  hash: data.hash256s.a,
  size: 256,
  version: 0,
  attributes: [createHighPriorityAttributeJSON()],
  script: data.buffers.a,
  sysfee: '10',
  netfee: '5',
  nonce: 10, // TODO
  sender: '', // TODO
  validuntilblock: 1000, // TODO
  signers: [], // TODO
  witnesses: [], // TODO
  data: {
    blockHash: data.hash256s.b,
    blockIndex: 5,
    blockTime: 0, // TODO
    confirmations: 0, // TODO
    transactionHash: '', // TODO
    transactionIndex: 10,
    globalIndex: '25',
  },
  ...options,
});

const createTransactionWithInvocationDataJSON = (
  options: Partial<TransactionWithInvocationDataJSON> = {},
): TransactionWithInvocationDataJSON => ({
  // TODO: get options into invocationData and createTransactionJSON()
  ...createTransactionJSON(),
  script: Buffer.from(data.buffers.a, 'hex').toString('hex'),
  gas: '0', // TODO
  invocationData: createInvocationDataJSON(),
  ...options,
});

const createIntegerContractParameterJSON = (
  options: Partial<IntegerContractParameterJSON> = {},
): IntegerContractParameterJSON => ({
  name: 'param',
  type: 'Integer',
  value: '20',
  ...options,
});

const createTransactionResultSuccessJSON = (
  options: Partial<TransactionResultSuccessJSON> = {},
): TransactionResultSuccessJSON => ({
  script: '', // TODO
  state: 'HALT',
  gas_consumed: '20',
  gas_cost: '20',
  stack: [createIntegerContractParameterJSON()],
  ...options,
});

const createTransactionResultErrorJSON = (
  options: Partial<TransactionResultErrorJSON> = {},
): TransactionResultErrorJSON => ({
  script: '', // TODO
  state: 'FAULT',
  gas_consumed: '20',
  gas_cost: '20',
  stack: [createIntegerContractParameterJSON()],
  message: 'failure',
  ...options,
});

const createRawInvocationResultSuccessJSON = (
  options: Partial<RawInvocationResultSuccessJSON> = {},
): RawInvocationResultSuccessJSON => ({
  state: 'HALT',
  gas_consumed: '20',
  stack: [createIntegerContractParameterJSON()],
  ...options,
});

const createRawInvocationResultErrorJSON = (
  options: Partial<RawInvocationResultErrorJSON> = {},
): RawInvocationResultErrorJSON => ({
  state: 'FAULT',
  gas_consumed: '20',
  stack: [createIntegerContractParameterJSON()],
  ...options,
});

const createInvocationDataJSON = (options: Partial<InvocationDataJSON> = {}): InvocationDataJSON => ({
  result: createTransactionResultSuccessJSON(),
  contracts: [createContractJSON()],
  deletedContractHashes: [keys[2].scriptHashString],
  migratedContractHashes: [[keys[0].scriptHashString, keys[1].scriptHashString]],
  voteUpdates: [],
  actions: [createNotificationActionJSON(), createLogActionJSON()],
  storageChanges: [],
  ...options,
});

const createTransactionModel = (options: Partial<TransactionModelAdd> = {}): TransactionModel => {
  const invocation = createTransactionWithInvocationDataJSON();

  return new TransactionModel({
    script: Buffer.from(invocation.script, 'hex'),
    version: invocation.version,
    attributes: [],
    systemFee: new BN(0), // TODO
    hash: common.hexToUInt256(invocation.hash),
    ...options,
  });
};

const createTransactionReceipt = (options: Partial<TransactionReceipt> = {}): TransactionReceipt => ({
  blockHash: data.hash256s.a,
  blockIndex: 0,
  transactionIndex: 3,
  transactionHash: '', // TODO
  blockTime: 0, // TODO
  confirmations: 10, // TODO
  globalIndex: new BigNumber(4),
  ...options,
});

const createCallReceiptJSON = (options: Partial<CallReceiptJSON> = {}): CallReceiptJSON => ({
  result: createTransactionResultSuccessJSON(),
  actions: [createNotificationActionJSON(), createLogActionJSON()],
  ...options,
});

const createVerifyScriptResultJSON = (options: Partial<VerifyScriptResultJSON> = {}): VerifyScriptResultJSON => ({
  hash: keys[0].scriptHashString,
  witness: factory.createWitness(),
  actions: [createLogActionJSON()],
  ...options,
});

const createVerifyTransactionResultJSON = (
  options: Partial<VerifyTransactionResultJSON> = {},
): VerifyTransactionResultJSON => ({
  verifications: [createVerifyScriptResultJSON()],
  ...options,
});

const createHeaderJSON = (options: Partial<HeaderJSON> = {}): HeaderJSON => ({
  version: 0,
  hash: data.hash256s.a,
  previousblockhash: data.hash256s.b,
  merkleroot: data.hash256s.c,
  time: data.timestamps.past.toString(),
  index: 10,
  nextconsensus: keys[0].address,
  witnesses: [createWitnessJSON()],
  size: 256,
  ...options,
});

const createBlockJSON = (options: Partial<BlockJSON> = {}): BlockJSON => ({
  ...createHeaderJSON(),
  tx: [createTransactionWithInvocationDataJSON()],
  ...options,
});

const createPeerJSON = (options: Partial<Peer> = {}): Peer => ({
  address: 'localhost',
  port: 1340,
  ...options,
});

const createNetworkSettingsJSON = (options: Partial<NetworkSettingsJSON> = {}): NetworkSettingsJSON => ({
  issueGASFee: data.bigNumbers.a.toString(10),
  ...options,
});

const createStorageItemJSON = (options: Partial<StorageItemJSON> = {}): StorageItemJSON => ({
  hash: keys[0].scriptHashString,
  key: data.buffers.a,
  value: data.buffers.b,
  flags: 'None',
  ...options,
});

const createAnyContractParameterJSON = (options: Partial<AnyContractParameterJSON> = {}): AnyContractParameterJSON => ({
  name: 'param',
  type: 'Any',
  value: undefined,
  ...options,
});

const createArrayContractParameterJSON = (
  options: Partial<ArrayContractParameterJSON> = {},
): ArrayContractParameterJSON => ({
  name: 'param',
  type: 'Array',
  value: [createBooleanContractParameterJSON()],
  ...options,
});

const createBooleanContractParameterJSON = (
  options: Partial<BooleanContractParameterJSON> = {},
): BooleanContractParameterJSON => ({
  name: 'param',
  type: 'Boolean',
  value: true,
  ...options,
});

const createByteArrayContractParameterJSON = (
  options: Partial<ByteArrayContractParameterJSON> = {},
): ByteArrayContractParameterJSON => ({
  name: 'param',
  type: 'ByteArray',
  value: Buffer.alloc(1, 0xff).toString(),
  ...options,
});

const createHash160ContractParameterJSON = (
  options: Partial<Hash160ContractParameterJSON> = {},
): Hash160ContractParameterJSON => ({
  name: 'param',
  type: 'Hash160',
  value: keys[0].scriptHashString,
  ...options,
});

const createHash256ContractParameterJSON = (
  options: Partial<Hash256ContractParameterJSON> = {},
): Hash256ContractParameterJSON => ({
  name: 'param',
  type: 'Hash256',
  value: data.hash256s.a,
  ...options,
});

const createInteropInterfaceContractParameterJSON = (options: Partial<InteropInterfaceContractParameterJSON> = {}) => ({
  type: 'InteropInterface' as 'InteropInterface',
  name: 'param',
  ...options,
});

const createMapContractParameterJSON = (options: Partial<MapContractParameterJSON> = {}): MapContractParameterJSON => ({
  name: 'param',
  type: 'Map',
  value: [[createIntegerContractParameterJSON(), createBooleanContractParameterJSON()]],
  ...options,
});

const createPublicKeyContractParameterJSON = (
  options: Partial<PublicKeyContractParameterJSON> = {},
): PublicKeyContractParameterJSON => ({
  name: 'param',
  type: 'PublicKey',
  value: keys[0].publicKeyString,
  ...options,
});

const createSignatureContractParameterJSON = (
  options: Partial<SignatureContractParameterJSON> = {},
): SignatureContractParameterJSON => ({
  name: 'param',
  type: 'Signature',
  value: data.signatures.a,
  ...options,
});

const createStringContractParameterJSON = (
  options: Partial<StringContractParameterJSON> = {},
): StringContractParameterJSON => ({
  name: 'param',
  type: 'String',
  value: 'test',
  ...options,
});

const createVoidContractParameterJSON = (
  options: Partial<VoidContractParameterJSON> = {},
): VoidContractParameterJSON => ({
  name: 'param',
  type: 'Void',
  ...options,
});

const createContract = (options: Partial<Contract> = {}): Contract => ({
  version: 0,
  address: keys[0].address,
  script: data.buffers.b,
  parameters: ['Address', 'Buffer'],
  returnType: 'Buffer',
  name: 'MyContract',
  codeVersion: '1.0',
  author: 'dicarlo2',
  email: 'alex.dicarlo@neotracker.io',
  description: 'Hello World',
  storage: true,
  dynamicInvoke: false,
  payable: true,
  ...options,
});

const createRawActionBase = (options: Partial<RawActionBase> = {}): RawActionBase => ({
  version: 0,
  blockHash: data.hash256s.a,
  blockIndex: 0,
  transactionHash: data.hash256s.b,
  transactionIndex: 1,
  index: data.numbers.a,
  globalIndex: data.bigNumbers.a,
  address: keys[0].address,
  ...options,
});

const createRawNotification = (options: Partial<RawNotification> = {}): RawNotification => ({
  ...createRawActionBase(),
  type: 'Notification',
  args: [createIntegerContractParameter()],
  ...options,
});

const createRawTransferNotification = (options: Partial<RawNotification> = {}): RawNotification =>
  createRawNotification({
    args: [
      createStringContractParameter({ value: 'transfer' }),
      createHash160ContractParameter({ value: keys[0].address }),
      createHash160ContractParameter({ value: keys[1].address }),
      createIntegerContractParameter({ value: data.bns.b }),
    ],
    ...options,
  });

const createRawLog = (options: Partial<RawLog> = {}): RawLog => ({
  ...createRawActionBase(),
  type: 'Log',
  message: 'Hello World',
  ...options,
});

const createWitness = (options: Partial<Witness> = {}): Witness => ({
  invocation: data.buffers.a,
  verification: data.buffers.b,
  ...options,
});

const createTransaction = (options: Partial<Transaction> = {}): Transaction => ({
  hash: data.hash256s.a,
  size: 256,
  version: 0,
  nonce: 0,
  validUntilBlock: 0,
  signers: [],
  attributes: [],
  witnesses: [createWitness()],
  systemFee: new BigNumber('10'),
  networkFee: new BigNumber('5'),
  script: data.buffers.a,
  ...options,
});

const createHash160ContractParameter = (options: Partial<Hash160ContractParameter> = {}): Hash160ContractParameter => ({
  name: 'param',
  type: 'Hash160',
  value: keys[0].address,
  ...options,
});

const createStringContractParameter = (options: Partial<StringContractParameter> = {}): StringContractParameter => ({
  name: 'param',
  type: 'String',
  value: 'transfer',
  ...options,
});

const createIntegerContractParameter = (options: Partial<IntegerContractParameter> = {}): IntegerContractParameter => ({
  name: 'param',
  type: 'Integer',
  value: new BN(20),
  ...options,
});

const createBooleanContractParameter = (options: Partial<BooleanContractParameter> = {}): BooleanContractParameter => ({
  name: 'param',
  type: 'Boolean',
  value: true,
  ...options,
});

const createRawInvocationResultError = (
  options: Partial<RawTransactionResultError> = {},
): RawTransactionResultError => ({
  script: '', // TODO
  state: 'FAULT',
  gasConsumed: new BigNumber('10'),
  gasCost: new BigNumber('20'),
  stack: [createIntegerContractParameter()],
  message: 'Failure!',
  ...options,
});

const createRawInvocationResultSuccess = (
  options: Partial<RawTransactionResultSuccess> = {},
): RawTransactionResultSuccess => ({
  script: '', // TODO
  state: 'HALT',
  gasConsumed: new BigNumber('10'),
  gasCost: new BigNumber('20'),
  stack: [createIntegerContractParameter()],
  ...options,
});

const createInvocationResultError = (options: Partial<TransactionResultError> = {}): TransactionResultError => ({
  script: '', // TODO
  state: 'FAULT',
  gasConsumed: new BigNumber('20'),
  gasCost: new BigNumber('10'),
  message: 'Failed!',
  ...options,
});

const createInvocationResultSuccess = (
  options: Partial<TransactionResultSuccess<boolean>> = {},
): TransactionResultSuccess<boolean> => ({
  script: '', // TODO
  state: 'HALT',
  gasConsumed: new BigNumber('20'),
  gasCost: new BigNumber('10'),
  value: true,
  ...options,
});

const createRawInvocationData = (options: Partial<RawInvocationData> = {}): RawInvocationData => ({
  result: createRawInvocationResultSuccess(),
  contracts: [createContract()],
  deletedContractAddresses: [keys[2].address],
  migratedContractAddresses: [[keys[0].address, keys[1].address]],
  actions: [createRawNotification(), createRawLog()],
  storageChanges: [],
  ...options,
});

const createConfirmedTransactionBase = (options: Partial<ConfirmedTransaction> = {}): ConfirmedTransaction => ({
  receipt: {
    blockHash: data.hash256s.a,
    blockIndex: 10,
    transactionIndex: 1,
    globalIndex: new BigNumber('11'),
  },
  ...options,
});

const createConfirmedTransaction = (options: Partial<ConfirmedTransaction> = {}): ConfirmedTransaction => ({
  ...createTransaction(),
  ...createConfirmedTransactionBase(),
  invocationData: createRawInvocationData(),
  ...options,
});

const createRawCallReceipt = (options: Partial<RawCallReceipt> = {}): RawCallReceipt => ({
  result: createRawInvocationResultSuccess(),
  actions: [createRawNotification(), createRawLog()],
  ...options,
});

const createRawInvokeReceipt = (options: Partial<RawInvokeReceipt> = {}): RawInvokeReceipt => ({
  blockIndex: 10,
  blockHash: data.hash256s.a,
  transactionIndex: 1,
  globalIndex: new BigNumber(11),
  result: createRawInvocationResultSuccess(),
  actions: [createRawNotification(), createRawLog()],
  ...options,
});

const createNetworkSettings = (options: Partial<NetworkSettings> = {}): NetworkSettings => ({
  issueGASFee: data.bigNumbers.a,
  ...options,
});

const createUserAccountID = (options: Partial<UserAccountID> = {}): UserAccountID => ({
  network: 'main',
  address: keys[1].address,
  ...options,
});

const createUserAccount = (options: Partial<UserAccount> = {}): UserAccount => ({
  id: createUserAccountID(),
  name: 'Mock',
  publicKey: keys[1].publicKeyString,
  ...options,
});

const createLockedWallet = (options: Partial<LockedWallet> = {}): LockedWallet => ({
  type: 'locked',
  userAccount: createUserAccount(),
  nep2: keys[1].encryptedWIF,
  ...options,
});

const createUnlockedWallet = (options: Partial<UnlockedWallet> = {}): UnlockedWallet => ({
  type: 'unlocked',
  userAccount: createUserAccount({
    id: createUserAccountID({
      address: keys[0].address,
    }),
    publicKey: keys[0].publicKeyString,
  }),
  privateKey: keys[0].privateKeyString,
  nep2: keys[0].encryptedWIF,
  ...options,
});

const createOtherWallet = (options: Partial<UnlockedWallet> = {}): UnlockedWallet => ({
  type: 'unlocked',
  userAccount: createUserAccount({
    id: createUserAccountID({
      address: keys[1].address,
    }),
    publicKey: keys[1].publicKeyString,
  }),
  privateKey: keys[1].privateKeyString,
  nep2: keys[1].encryptedWIF,
  ...options,
});

const createTransfer = (options: Partial<Transfer> = {}): Transfer => ({
  to: keys[0].address,
  amount: data.bigNumbers.a,
  asset: Hash256.NEO,
  ...options,
});

const createHash160ABIParameter = (options: Partial<Hash160ABIParameter> = {}): Hash160ABIParameter => ({
  type: 'Hash160',
  name: 'from',
  ...options,
});

const createIntegerABIParameter = (options: Partial<IntegerABIParameter> = {}): IntegerABIParameter => ({
  type: 'Integer',
  name: 'amount',
  decimals: 8,
  ...options,
});

const createDeployContractMethodDescriptor = (
  options: Partial<ContractMethodDescriptor> = {},
): ContractMethodDescriptor => ({
  name: 'deploy',
  parameters: [],
  returnType: { type: 'Boolean' },
  ...options,
});

const createABIEvent = (options: Partial<ContractEventDescriptor> = {}): ContractEventDescriptor => ({
  name: 'transfer',
  parameters: [
    createHash160ABIParameter({ name: 'from' }),
    createHash160ABIParameter({ name: 'to' }),
    createIntegerABIParameter({ name: 'amount' }),
  ],
  ...options,
});

const createStringABIReturn = (): StringABIReturn => ({
  type: 'String',
});

const createIntegerABIReturn = (): IntegerABIReturn => ({
  type: 'Integer',
  decimals: 0,
});

const createStringABIParameter = (options: Partial<StringABIParameter> = {}): StringABIParameter => ({
  type: 'String',
  name: 'foo',
  ...options,
});

const createABI = (options: Partial<ContractABI> = {}): ContractABI => ({
  ...nep5.abi(8),
  ...options,
});

const createForwardValue = (options: Partial<ForwardValue> = {}): ForwardValue =>
  // tslint:disable-next-line:no-object-literal-type-assertion
  ({
    name: 'foo',
    converted: true,
    param: true,
    ...options,
  } as ForwardValue);

const createContractMethodDescriptor = (options: Partial<ContractMethodDescriptor> = {}): ContractMethodDescriptor => ({
  name: 'foo',
  parameters: [],
  returnType: { type: 'Boolean' },
  send: false,
  receive: false,
  sendUnsafe: false,
  refundAssets: false,
  completeSend: false,
  claim: false,
  ...options,
});

const createSmartContractDefinition = (options: Partial<SmartContractDefinition> = {}): SmartContractDefinition => ({
  networks: {
    main: {
      address: keys[0].address,
    },
  },
  manifest: createContractManifest(),
  ...options,
});

const createTransactionResult = (options: Partial<TransactionResult> = {}): TransactionResult => ({
  transaction: createTransaction(),
  confirmed: jest.fn(async () => createTransactionReceipt()),
  ...options,
});

const createHeader = (options: Partial<Header> = {}): Header => ({
  version: 0,
  hash: data.hash256s.a,
  previousBlockHash: data.hash256s.b,
  merkleRoot: data.hash256s.c,
  time: data.timestamps.past,
  index: 10,
  nextConsensus: keys[0].address,
  size: 256,
  witnesses: [createWitness()],
  witness: createWitness(),
  ...options,
});

const createBlock = (options: Partial<Block> = {}): Block => ({
  ...createHeader(),
  transactions: [createConfirmedTransaction()],
  ...options,
});

export const factory = {
  createContractJSON,
  createAnyContractParameterJSON,
  createIntegerContractParameterJSON,
  createArrayContractParameterJSON,
  createBooleanContractParameterJSON,
  createByteArrayContractParameterJSON,
  createHash160ContractParameterJSON,
  createHash256ContractParameterJSON,
  createInteropInterfaceContractParameterJSON,
  createMapContractParameterJSON,
  createPublicKeyContractParameterJSON,
  createSignatureContractParameterJSON,
  createStringContractParameterJSON,
  createVoidContractParameterJSON,
  createInvocationDataJSON,
  createTransactionResultSuccessJSON,
  createTransactionResultErrorJSON,
  createTransactionJSON,
  createTransactionWithInvocationDataJSON,
  createTransactionReceipt,
  createCallReceiptJSON,
  createLogActionJSON,
  createVerifyScriptResultJSON,
  createVerifyTransactionResultJSON,
  createBlockJSON,
  createPeerJSON,
  createNetworkSettingsJSON,
  createStorageItemJSON,
  createContract,
  createRawInvocationData,
  createTransactionModel,
  createTransaction,
  createConfirmedTransaction,
  createInvocationResultSuccess,
  createInvocationResultError,
  createRawCallReceipt,
  createNetworkSettings,
  createWitness,
  createLockedWallet,
  createUnlockedWallet,
  createOtherWallet,
  createTransfer,
  createDeployContractMethodDescriptor,
  createRawInvocationResultError,
  createRawInvocationResultSuccess,
  createRawLog,
  createRawNotification,
  createABIEvent,
  createContractMethodDescriptor,
  createForwardValue,
  createHash160ContractParameter,
  createIntegerContractParameter,
  createStringContractParameter,
  createStringABIReturn,
  createIntegerABIParameter,
  createIntegerABIReturn,
  createStringABIParameter,
  createRawTransferNotification,
  createSmartContractDefinition,
  createRawInvokeReceipt,
  createBooleanContractParameter,
  createUserAccount,
  createUserAccountID,
  createTransactionResult,
  createBlock,
  createRawInvocationResultSuccessJSON,
  createRawInvocationResultErrorJSON,
};
