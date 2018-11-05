// tslint:disable deprecation
import {
  ABI,
  ABIEvent,
  ABIFunction,
  Account,
  AccountJSON,
  ActionBaseJSON,
  AddressABIParameter,
  AddressAttribute,
  AddressContractParameter,
  Asset,
  AssetJSON,
  AttributeJSON,
  Block,
  BlockJSON,
  BooleanContractParameter,
  BufferAttribute,
  CallReceiptJSON,
  ClaimTransaction,
  ClaimTransactionJSON,
  ConfirmedClaimTransaction,
  ConfirmedContractTransaction,
  ConfirmedEnrollmentTransaction,
  ConfirmedInvocationTransaction,
  ConfirmedIssueTransaction,
  ConfirmedMinerTransaction,
  ConfirmedPublishTransaction,
  ConfirmedRegisterTransaction,
  ConfirmedStateTransaction,
  ConfirmedTransactionBase,
  Contract,
  ContractJSON,
  ContractTransaction,
  ContractTransactionJSON,
  EnrollmentTransaction,
  EnrollmentTransactionJSON,
  Hash256Attribute,
  Header,
  HeaderJSON,
  Input,
  InputJSON,
  InputOutput,
  IntegerABIParameter,
  IntegerABIReturn,
  IntegerContractParameter,
  IntegerContractParameterJSON,
  InvocationDataJSON,
  InvocationResultError,
  InvocationResultSuccess,
  InvocationResultSuccessJSON,
  InvocationTransaction,
  InvocationTransactionJSON,
  IssueTransaction,
  IssueTransactionJSON,
  LogActionJSON,
  MinerTransaction,
  MinerTransactionJSON,
  NetworkSettings,
  NetworkSettingsJSON,
  NotificationActionJSON,
  Output,
  OutputJSON,
  Peer,
  PublicKeyAttribute,
  PublishTransaction,
  PublishTransactionJSON,
  RawActionBase,
  RawCallReceipt,
  RawInvocationData,
  RawInvocationResultError,
  RawInvocationResultSuccess,
  RawInvokeReceipt,
  RawLog,
  RawNotification,
  RegisterTransaction,
  RegisterTransactionJSON,
  SmartContractDefinition,
  StateTransaction,
  StateTransactionJSON,
  StorageItemJSON,
  StringABIParameter,
  StringABIReturn,
  StringContractParameter,
  TransactionBase,
  TransactionBaseJSON,
  TransactionReceipt,
  TransactionResult,
  Transfer,
  UserAccount,
  UserAccountID,
  VMState,
  Witness,
  WitnessJSON,
} from '@neo-one/client-common';
import { Hash256, LockedWallet, nep5, UnlockedWallet } from '@neo-one/client-core';
import BigNumber from 'bignumber.js';
import BN from 'bn.js';
import { AssetRegister, ContractRegister } from '../types';
import { data } from './data';
import { keys } from './keys';

const createInputJSON = (options: Partial<InputJSON> = {}): InputJSON => ({
  txid: data.hash256s.a,
  vout: 2,
  ...options,
});

const createAccountJSON = (options: Partial<AccountJSON> = {}): AccountJSON => ({
  version: 0,
  script_hash: keys[0].scriptHashString,
  frozen: false,
  votes: [keys[0].publicKeyString],
  balances: [
    { asset: Hash256.NEO, value: data.bigNumbers.a.toString(10) },
    { asset: Hash256.GAS, value: data.bigNumbers.b.toString(10) },
  ],
  unspent: [
    createInputJSON(),
    {
      txid: data.hash256s.b,
      vout: 0,
    },
  ],
  unclaimed: [
    {
      txid: data.hash256s.c,
      vout: 3,
    },
    {
      txid: data.hash256s.d,
      vout: 0,
    },
  ],
  ...options,
});

const createOutputJSON = (options: Partial<OutputJSON> = {}): OutputJSON => ({
  n: 0,
  asset: Hash256.NEO,
  value: data.bigNumbers.a.toString(10),
  address: keys[0].address,
  ...options,
});

const createAssetJSON = (options: Partial<AssetJSON> = {}): AssetJSON => ({
  version: 0,
  id: data.hash256s.c,
  type: 'Token',
  name: 'TheToken',
  amount: '100000000',
  available: '10000000',
  precision: 8,
  owner: keys[0].publicKeyString,
  admin: keys[0].address,
  issuer: keys[1].address,
  expiration: 1534418216,
  frozen: false,
  ...options,
});

const createContractJSON = (options: Partial<ContractJSON> = {}): ContractJSON => ({
  version: 0,
  hash: keys[0].scriptHashString,
  script: data.buffers.b,
  parameters: ['Hash160', 'ByteArray'],
  returntype: 'ByteArray',
  name: 'MyContract',
  code_version: '1.0',
  author: 'dicarlo2',
  email: 'alex.dicarlo@neotracker.io',
  description: 'Hello World',
  properties: {
    storage: true,
    dynamic_invoke: false,
    payable: true,
  },
  ...options,
});

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

const createUInt160AttributeJSON = (options: Partial<AttributeJSON> = {}): AttributeJSON => ({
  usage: 'Script',
  data: keys[0].scriptHashString,
  ...options,
});

const createUInt256AttributeJSON = (options: Partial<AttributeJSON> = {}): AttributeJSON => ({
  usage: 'Hash1',
  data: data.hash256s.b,
  ...options,
});

const createBufferAttributeJSON = (options: Partial<AttributeJSON> = {}): AttributeJSON => ({
  usage: 'Description',
  data: data.buffers.a,
  ...options,
});

const createECPointAttributeJSON = (options: Partial<AttributeJSON> = {}): AttributeJSON => ({
  usage: 'ECDH02',
  data: keys[0].publicKeyString,
  ...options,
});

const createWitnessJSON = (options: Partial<WitnessJSON> = {}): WitnessJSON => ({
  invocation: data.buffers.a,
  verification: data.buffers.b,
  ...options,
});

const createTransactionBaseJSON = (options: Partial<TransactionBaseJSON> = {}): TransactionBaseJSON => ({
  txid: data.hash256s.a,
  size: 256,
  version: 0,
  attributes: [
    createUInt160AttributeJSON(),
    createUInt256AttributeJSON(),
    createBufferAttributeJSON(),
    createECPointAttributeJSON(),
  ],
  vin: [createInputJSON()],
  vout: [createOutputJSON()],
  scripts: [createWitnessJSON()],
  sys_fee: '10',
  net_fee: '5',
  data: {
    blockHash: data.hash256s.b,
    blockIndex: 5,
    index: 10,
    globalIndex: '25',
  },
  ...options,
});

const createIntegerContractParameterJSON = (
  options: Partial<IntegerContractParameterJSON> = {},
): IntegerContractParameterJSON => ({
  type: 'Integer',
  value: '20',
  ...options,
});

const createInvocationResultSuccessJSON = (
  options: Partial<InvocationResultSuccessJSON> = {},
): InvocationResultSuccessJSON => ({
  state: VMState.Halt,
  gas_consumed: '20',
  gas_cost: '10',
  stack: [createIntegerContractParameterJSON()],
  ...options,
});

const createInvocationDataJSON = (options: Partial<InvocationDataJSON> = {}): InvocationDataJSON => ({
  result: createInvocationResultSuccessJSON(),
  asset: createAssetJSON(),
  contracts: [createContractJSON()],
  deletedContractHashes: [keys[2].scriptHashString],
  migratedContractHashes: [[keys[0].scriptHashString, keys[1].scriptHashString]],
  voteUpdates: [],
  actions: [createNotificationActionJSON(), createLogActionJSON()],
  ...options,
});

const createClaimTransactionJSON = (options: Partial<ClaimTransactionJSON> = {}): ClaimTransactionJSON => ({
  ...createTransactionBaseJSON(),
  type: 'ClaimTransaction',
  claims: [createInputJSON()],
  ...options,
});

const createContractTransactionJSON = (options: Partial<ContractTransactionJSON> = {}): ContractTransactionJSON => ({
  ...createTransactionBaseJSON(),
  type: 'ContractTransaction',
  ...options,
});

const createEnrollmentTransactionJSON = (
  options: Partial<EnrollmentTransactionJSON> = {},
): EnrollmentTransactionJSON => ({
  ...createTransactionBaseJSON(),
  type: 'EnrollmentTransaction',
  pubkey: keys[0].publicKeyString,
  ...options,
});

const createIssueTransactionJSON = (options: Partial<IssueTransactionJSON> = {}): IssueTransactionJSON => ({
  ...createTransactionBaseJSON(),
  type: 'IssueTransaction',
  ...options,
});

const createPublishTransactionJSON = (options: Partial<PublishTransactionJSON> = {}): PublishTransactionJSON => ({
  ...createTransactionBaseJSON(),
  type: 'PublishTransaction',
  contract: createContractJSON(),
  ...options,
});

const createRegisterTransactionJSON = (options: Partial<RegisterTransactionJSON> = {}): RegisterTransactionJSON => ({
  ...createTransactionBaseJSON(),
  type: 'RegisterTransaction',
  asset: createAssetJSON(),
  ...options,
});

const createStateTransactionJSON = (options: Partial<StateTransactionJSON> = {}): StateTransactionJSON => ({
  ...createTransactionBaseJSON(),
  type: 'StateTransaction',
  descriptors: [],
  ...options,
});

const createInvocationTransactionJSON = (
  options: Partial<InvocationTransactionJSON> = {},
): InvocationTransactionJSON => ({
  ...createTransactionBaseJSON(),
  type: 'InvocationTransaction',
  script: data.buffers.a,
  gas: '10',
  invocationData: createInvocationDataJSON(),
  ...options,
});

const createMinerTransactionJSON = (options: Partial<MinerTransactionJSON> = {}): MinerTransactionJSON => ({
  ...createTransactionBaseJSON(),
  type: 'MinerTransaction',
  nonce: 1234,
  ...options,
});

const createTransactionReceipt = (options: Partial<TransactionReceipt> = {}): TransactionReceipt => ({
  blockHash: data.hash256s.a,
  blockIndex: 0,
  transactionIndex: 3,
  ...options,
});

const createCallReceiptJSON = (options: Partial<CallReceiptJSON> = {}): CallReceiptJSON => ({
  result: createInvocationResultSuccessJSON(),
  actions: [createNotificationActionJSON(), createLogActionJSON()],
  ...options,
});

const createHeaderJSON = (options: Partial<HeaderJSON> = {}): HeaderJSON => ({
  version: 0,
  hash: data.hash256s.a,
  previousblockhash: data.hash256s.b,
  merkleroot: data.hash256s.c,
  time: data.timestamps.past,
  index: 10,
  nonce: '1234',
  nextconsensus: keys[0].address,
  script: createWitnessJSON(),
  size: 256,
  confirmations: 10,
  ...options,
});

const createBlockJSON = (options: Partial<BlockJSON> = {}): BlockJSON => ({
  ...createHeaderJSON(),
  tx: [
    createMinerTransactionJSON(),
    createClaimTransactionJSON(),
    createContractTransactionJSON(),
    createEnrollmentTransactionJSON(),
    createInvocationTransactionJSON(),
    createIssueTransactionJSON(),
    createPublishTransactionJSON(),
    createRegisterTransactionJSON(),
    createStateTransactionJSON(),
  ],
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
  ...options,
});

const createInput = (options: Partial<Input> = {}): Input => ({
  hash: data.hash256s.a,
  index: 0,
  ...options,
});

const createOutput = (options: Partial<Output> = {}): Output => ({
  asset: Hash256.NEO,
  value: data.bigNumbers.a,
  address: keys[0].address,
  ...options,
});

const createInputOutput = (options: Partial<InputOutput> = {}): InputOutput => ({
  ...createInput(),
  ...createOutput(),
  ...options,
});

const createAssetRegister = (options: Partial<AssetRegister> = {}): AssetRegister => ({
  type: 'Token',
  name: 'TheToken',
  amount: new BigNumber('100000000'),
  precision: 8,
  owner: keys[0].publicKeyString,
  admin: keys[0].address,
  issuer: keys[1].address,
  ...options,
});

const createAsset = (options: Partial<Asset> = {}): Asset => ({
  hash: data.hash256s.c,
  type: 'Token',
  name: 'TheToken',
  amount: new BigNumber('100000000'),
  available: new BigNumber('10000000'),
  precision: 8,
  owner: keys[0].publicKeyString,
  admin: keys[0].address,
  issuer: keys[1].address,
  expiration: 1534418216,
  frozen: false,
  ...options,
});

const createContractRegister = (options: Partial<ContractRegister> = {}): ContractRegister => ({
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
      createAddressContractParameter({ value: keys[0].address }),
      createAddressContractParameter({ value: keys[1].address }),
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

const createAddressAttribute = (options: Partial<AddressAttribute> = {}): AddressAttribute => ({
  usage: 'Script',
  data: keys[0].address,
  ...options,
});

const createHash256Attribute = (options: Partial<Hash256Attribute> = {}): Hash256Attribute => ({
  usage: 'Hash1',
  data: data.hash256s.b,
  ...options,
});

const createBufferAttribute = (options: Partial<BufferAttribute> = {}): BufferAttribute => ({
  usage: 'Description',
  data: data.buffers.a,
  ...options,
});

const createPublicKeyAttribute = (options: Partial<PublicKeyAttribute> = {}): PublicKeyAttribute => ({
  usage: 'ECDH02',
  data: keys[0].publicKeyString,
  ...options,
});

const createWitness = (options: Partial<Witness> = {}): Witness => ({
  invocation: data.buffers.a,
  verification: data.buffers.b,
  ...options,
});

const createTransactionBase = (options: Partial<TransactionBase> = {}): TransactionBase => ({
  hash: data.hash256s.a,
  size: 256,
  version: 0,
  attributes: [createAddressAttribute(), createHash256Attribute(), createBufferAttribute(), createPublicKeyAttribute()],
  inputs: [createInput()],
  outputs: [createOutput()],
  scripts: [createWitness()],
  systemFee: new BigNumber('10'),
  networkFee: new BigNumber('5'),
  ...options,
});

const createAddressContractParameter = (options: Partial<AddressContractParameter> = {}): AddressContractParameter => ({
  type: 'Address',
  value: keys[0].address,
  ...options,
});

const createStringContractParameter = (options: Partial<StringContractParameter> = {}): StringContractParameter => ({
  type: 'String',
  value: 'transfer',
  ...options,
});

const createIntegerContractParameter = (options: Partial<IntegerContractParameter> = {}): IntegerContractParameter => ({
  type: 'Integer',
  value: new BN(20),
  ...options,
});

const createBooleanContractParameter = (options: Partial<BooleanContractParameter> = {}): BooleanContractParameter => ({
  type: 'Boolean',
  value: true,
  ...options,
});

const createRawInvocationResultError = (options: Partial<RawInvocationResultError> = {}): RawInvocationResultError => ({
  state: 'FAULT',
  gasConsumed: new BigNumber('10'),
  gasCost: new BigNumber('20'),
  stack: [createIntegerContractParameter()],
  message: 'Failure!',
  ...options,
});

const createRawInvocationResultSuccess = (
  options: Partial<RawInvocationResultSuccess> = {},
): RawInvocationResultSuccess => ({
  state: 'HALT',
  gasConsumed: new BigNumber('10'),
  gasCost: new BigNumber('20'),
  stack: [createIntegerContractParameter()],
  ...options,
});

const createInvocationResultError = (options: Partial<InvocationResultError> = {}): InvocationResultError => ({
  state: 'FAULT',
  gasConsumed: new BigNumber('20'),
  gasCost: new BigNumber('10'),
  message: 'Failed!',
  ...options,
});

const createInvocationResultSuccess = (
  options: Partial<InvocationResultSuccess<boolean>> = {},
): InvocationResultSuccess<boolean> => ({
  state: 'HALT',
  gasConsumed: new BigNumber('20'),
  gasCost: new BigNumber('10'),
  value: true,
  ...options,
});

const createRawInvocationData = (options: Partial<RawInvocationData> = {}): RawInvocationData => ({
  result: createRawInvocationResultSuccess(),
  asset: createAsset(),
  contracts: [createContract()],
  deletedContractAddresses: [keys[2].address],
  migratedContractAddresses: [[keys[0].address, keys[1].address]],
  actions: [createRawNotification(), createRawLog()],
  ...options,
});

const createConfirmedTransactionBase = (options: Partial<ConfirmedTransactionBase> = {}): ConfirmedTransactionBase => ({
  receipt: {
    blockHash: data.hash256s.a,
    blockIndex: 10,
    index: 1,
    globalIndex: new BigNumber('11'),
  },
  ...options,
});

const createClaimTransaction = (options: Partial<ClaimTransaction> = {}): ClaimTransaction => ({
  ...createTransactionBase(),
  type: 'ClaimTransaction',
  claims: [createInput()],
  ...options,
});

const createContractTransaction = (options: Partial<ContractTransaction> = {}): ContractTransaction => ({
  ...createTransactionBase(),
  type: 'ContractTransaction',
  ...options,
});

const createEnrollmentTransaction = (options: Partial<EnrollmentTransaction> = {}): EnrollmentTransaction => ({
  ...createTransactionBase(),
  type: 'EnrollmentTransaction',
  publicKey: keys[0].publicKeyString,
  ...options,
});

const createIssueTransaction = (options: Partial<IssueTransaction> = {}): IssueTransaction => ({
  ...createTransactionBase(),
  type: 'IssueTransaction',
  ...options,
});

const createPublishTransaction = (options: Partial<PublishTransaction> = {}): PublishTransaction => ({
  ...createTransactionBase(),
  type: 'PublishTransaction',
  contract: createContract(),
  ...options,
});

const createRegisterTransaction = (options: Partial<RegisterTransaction> = {}): RegisterTransaction => ({
  ...createTransactionBase(),
  type: 'RegisterTransaction',
  asset: createAsset(),
  ...options,
});

const createStateTransaction = (options: Partial<StateTransaction> = {}): StateTransaction => ({
  ...createTransactionBase(),
  type: 'StateTransaction',
  ...options,
});

const createInvocationTransaction = (options: Partial<InvocationTransaction> = {}): InvocationTransaction => ({
  ...createTransactionBase(),
  type: 'InvocationTransaction',
  script: data.buffers.a,
  gas: new BigNumber('10'),
  ...options,
});

const createMinerTransaction = (options: Partial<MinerTransaction> = {}): MinerTransaction => ({
  ...createTransactionBase(),
  type: 'MinerTransaction',
  nonce: 1234,
  ...options,
});

const createConfirmedMinerTransaction = (
  options: Partial<ConfirmedMinerTransaction> = {},
): ConfirmedMinerTransaction => ({
  ...createMinerTransaction(),
  ...createConfirmedTransactionBase(),
  ...options,
});

const createConfirmedClaimTransaction = (
  options: Partial<ConfirmedClaimTransaction> = {},
): ConfirmedClaimTransaction => ({
  ...createClaimTransaction(),
  ...createConfirmedTransactionBase(),
  ...options,
});

const createConfirmedContractTransaction = (
  options: Partial<ConfirmedContractTransaction> = {},
): ConfirmedContractTransaction => ({
  ...createContractTransaction(),
  ...createConfirmedTransactionBase(),
  ...options,
});

const createConfirmedEnrollmentTransaction = (
  options: Partial<ConfirmedEnrollmentTransaction> = {},
): ConfirmedEnrollmentTransaction => ({
  ...createEnrollmentTransaction(),
  ...createConfirmedTransactionBase(),
  ...options,
});

const createConfirmedInvocationTransaction = (
  options: Partial<ConfirmedInvocationTransaction> = {},
): ConfirmedInvocationTransaction => ({
  ...createInvocationTransaction(),
  ...createConfirmedTransactionBase(),
  invocationData: createRawInvocationData(),
  ...options,
});

const createConfirmedIssueTransaction = (
  options: Partial<ConfirmedIssueTransaction> = {},
): ConfirmedIssueTransaction => ({
  ...createIssueTransaction(),
  ...createConfirmedTransactionBase(),
  ...options,
});

const createConfirmedPublishTransaction = (
  options: Partial<ConfirmedPublishTransaction> = {},
): ConfirmedPublishTransaction => ({
  ...createPublishTransaction(),
  ...createConfirmedTransactionBase(),
  ...options,
});

const createConfirmedRegisterTransaction = (
  options: Partial<ConfirmedRegisterTransaction> = {},
): ConfirmedRegisterTransaction => ({
  ...createRegisterTransaction(),
  ...createConfirmedTransactionBase(),
  ...options,
});

const createConfirmedStateTransaction = (
  options: Partial<ConfirmedStateTransaction> = {},
): ConfirmedStateTransaction => ({
  ...createStateTransaction(),
  ...createConfirmedTransactionBase(),
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
  account: createUserAccount(),
  nep2: keys[1].encryptedWIF,
  ...options,
});

const createUnlockedWallet = (options: Partial<UnlockedWallet> = {}): UnlockedWallet => ({
  type: 'unlocked',
  account: createUserAccount({
    id: createUserAccountID({
      address: keys[0].address,
    }),
    publicKey: keys[0].publicKeyString,
  }),
  privateKey: keys[0].privateKeyString,
  nep2: keys[0].encryptedWIF,
  ...options,
});

const createTransfer = (options: Partial<Transfer> = {}): Transfer => ({
  to: keys[0].address,
  amount: data.bigNumbers.a,
  asset: Hash256.NEO,
  ...options,
});

const createAddressABIParameter = (options: Partial<AddressABIParameter> = {}): AddressABIParameter => ({
  type: 'Address',
  name: 'from',
  ...options,
});

const createIntegerABIParameter = (options: Partial<IntegerABIParameter> = {}): IntegerABIParameter => ({
  type: 'Integer',
  name: 'amount',
  decimals: 8,
  ...options,
});

const createDeployABIFunction = (options: Partial<ABIFunction> = {}): ABIFunction => ({
  name: 'deploy',
  parameters: [],
  returnType: { type: 'Boolean' },
  ...options,
});

const createABIEvent = (options: Partial<ABIEvent> = {}): ABIEvent => ({
  name: 'transfer',
  parameters: [
    createAddressABIParameter({ name: 'from' }),
    createAddressABIParameter({ name: 'to' }),
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

const createABI = (options: Partial<ABI> = {}): ABI => ({
  ...nep5.abi(8),
  ...options,
});

const createSmartContractDefinition = (options: Partial<SmartContractDefinition> = {}): SmartContractDefinition => ({
  networks: {
    main: {
      address: keys[0].address,
    },
  },
  abi: createABI(),
  ...options,
});

const createTransactionResult = (options: Partial<TransactionResult> = {}): TransactionResult => ({
  transaction: createContractTransaction(),
  confirmed: jest.fn(async () => createTransactionReceipt()),
  ...options,
});

const createAccount = (options: Partial<Account> = {}): Account => ({
  address: keys[0].address,
  balances: {
    [Hash256.NEO]: data.bigNumbers.a,
    [Hash256.GAS]: data.bigNumbers.b,
  },
  ...options,
});

const createHeader = (options: Partial<Header> = {}): Header => ({
  version: 0,
  hash: data.hash256s.a,
  previousBlockHash: data.hash256s.b,
  merkleRoot: data.hash256s.c,
  time: data.timestamps.past,
  index: 10,
  nonce: '1234',
  nextConsensus: keys[0].address,
  script: createWitnessJSON(),
  size: 256,
  ...options,
});

const createBlock = (options: Partial<Block> = {}): Block => ({
  ...createHeader(),
  transactions: [
    createConfirmedMinerTransaction(),
    createConfirmedClaimTransaction(),
    createConfirmedContractTransaction(),
    createConfirmedEnrollmentTransaction(),
    createConfirmedInvocationTransaction(),
    createConfirmedIssueTransaction(),
    createConfirmedPublishTransaction(),
    createConfirmedRegisterTransaction(),
    createConfirmedStateTransaction(),
  ],
  ...options,
});

export const factory = {
  createAccountJSON,
  createAssetJSON,
  createContractJSON,
  createInputJSON,
  createOutputJSON,
  createInvocationDataJSON,
  createInvocationResultSuccessJSON,
  createInvocationTransactionJSON,
  createTransactionReceipt,
  createCallReceiptJSON,
  createBlockJSON,
  createPeerJSON,
  createNetworkSettingsJSON,
  createStorageItemJSON,
  createAsset,
  createContract,
  createInput,
  createOutput,
  createRawInvocationData,
  createInvocationTransaction,
  createInvocationResultSuccess,
  createMinerTransaction,
  createInputOutput,
  createRawCallReceipt,
  createNetworkSettings,
  createBufferAttribute,
  createAddressAttribute,
  createHash256Attribute,
  createPublicKeyAttribute,
  createWitness,
  createLockedWallet,
  createUnlockedWallet,
  createTransfer,
  createContractTransaction,
  createClaimTransaction,
  createContractRegister,
  createRegisterTransaction,
  createDeployABIFunction,
  createAssetRegister,
  createPublishTransaction,
  createRawInvocationResultError,
  createRawInvocationResultSuccess,
  createInvocationResultError,
  createIssueTransaction,
  createRawLog,
  createRawNotification,
  createABIEvent,
  createAddressContractParameter,
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
  createEnrollmentTransaction,
  createStateTransaction,
  createAccount,
  createBlock,
};
