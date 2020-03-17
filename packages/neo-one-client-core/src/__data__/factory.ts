// tslint:disable deprecation
import {
  Account,
  ActionBaseJSON,
  AddressAttribute,
  AddressContractParameter,
  ArrayContractParameterJSON,
  AttributeJSON,
  Block,
  BlockJSON,
  BooleanContractParameter,
  BooleanContractParameterJSON,
  BufferAttribute,
  ByteArrayContractParameterJSON,
  CallReceiptJSON,
  ConfirmedTransaction,
  ConfirmedTransactionJSON,
  ConsensusData,
  ConsensusDataJSON,
  Contract,
  ContractAbi,
  ContractAbiJSON,
  ContractEvent,
  ContractEventJSON,
  ContractGroup,
  ContractGroupJSON,
  ContractJSON,
  ContractManifest,
  ContractManifestJSON,
  ContractMethodDescriptor,
  ContractMethodDescriptorJSON,
  ContractParameterDeclaration,
  ContractParameterDeclarationJSON,
  ContractPermissionDescriptor,
  ContractPermissionDescriptorJSON,
  ContractPermissions,
  ContractPermissionsJSON,
  Cosigner,
  CosignerJSON,
  Hash160ContractParameterJSON,
  Hash256Attribute,
  Hash256ContractParameterJSON,
  Header,
  HeaderJSON,
  IntegerContractParameter,
  IntegerContractParameterJSON,
  InteropInterfaceContractParameterJSON,
  InvocationResultError,
  InvocationResultErrorJSON,
  InvocationResultSuccess,
  InvocationResultSuccessJSON,
  LogActionJSON,
  MapContractParameterJSON,
  NetworkSettings,
  NetworkSettingsJSON,
  NotificationActionJSON,
  Peer,
  PluginJSON,
  PublicKeyAttribute,
  PublicKeyContractParameterJSON,
  RawActionBase,
  RawCallReceipt,
  RawInvocationResultError,
  RawInvocationResultSuccess,
  RawLog,
  RawNotification,
  SignatureContractParameterJSON,
  StorageItemJSON,
  StringContractParameter,
  StringContractParameterJSON,
  Transaction,
  TransactionJSON,
  TransactionReceipt,
  TransactionReceiptJSON,
  TransactionResult,
  Transfer,
  UserAccount,
  UserAccountID,
  ValidatorJSON,
  VerifyScriptResultJSON,
  VerifyTransactionResultJSON,
  VersionJSON,
  VoidContractParameterJSON,
  WildcardContainer,
  Witness,
  WitnessJSON,
} from '@neo-one/client-common';
import BigNumber from 'bignumber.js';
import { BN } from 'bn.js';
import { Hash256 } from '../Hash256';
import { LockedWallet, UnlockedWallet } from '../user';
import { data } from './data';
import { keys } from './keys';

export const contractParamDeclarationJSON: { readonly [key: string]: ContractParameterDeclarationJSON } = {
  boolean: {
    type: 'Boolean',
    name: 'param',
  },
  byteArray: {
    type: 'ByteArray',
    name: 'param',
  },
  hash160: {
    type: 'Hash160',
    name: 'param',
  },
  hash256: {
    type: 'Hash256',
    name: 'param',
  },
  array: {
    type: 'Array',
    name: 'param',
  },
  integer: {
    type: 'Integer',
    name: 'param',
  },
  interopInterface: {
    type: 'InteropInterface',
    name: 'param',
  },
  map: {
    type: 'Map',
    name: 'param',
  },
  publicKey: {
    type: 'PublicKey',
    name: 'param',
  },
  signature: {
    type: 'Signature',
    name: 'param',
  },
  string: {
    type: 'String',
    name: 'param',
  },
  void: {
    type: 'Void',
    name: 'param',
  },
};

export const createContractEventJSON = ({
  parameters = [contractParamDeclarationJSON.boolean],
  name = 'event',
}: Partial<ContractEventJSON> = {}): ContractEventJSON => ({
  name,
  parameters,
});

export const createContractMethodDescriptorJSON = ({
  parameters = [contractParamDeclarationJSON.boolean],
  returnType = 'Void',
  name = 'event',
}: Partial<ContractMethodDescriptorJSON> = {}): ContractMethodDescriptorJSON => ({
  name,
  parameters,
  returnType,
});

export const createContractAbiJSON = ({
  methods = [createContractMethodDescriptorJSON()],
  events = [createContractEventJSON()],
  entryPoint = createContractMethodDescriptorJSON(),
  hash = keys[0].scriptHashString,
}: Partial<ContractAbiJSON> = {}): ContractAbiJSON => ({ hash, entryPoint, methods, events });

export const createContractGroupJSON = ({
  publicKey = keys[0].publicKeyString,
  signature = 'ccaab040cc25021c91567b75db4778853441869157b8f6aad960cdcf1069812480027a528ca9b98e2205027de20696f848cf81824eeb7af1d5110870870ceb67',
}: Partial<ContractGroupJSON> = {}): ContractGroupJSON => ({ publicKey, signature });

export const createContractPermissionDescriptorJSON = ({
  hashOrGroupType,
}: {
  readonly hashOrGroupType: 'uint160' | 'ecpoint' | undefined;
}): ContractPermissionDescriptorJSON => {
  if (hashOrGroupType === 'uint160') {
    return keys[0].scriptHashString;
  }
  if (hashOrGroupType === 'ecpoint') {
    return keys[0].publicKeyString;
  }

  return '*';
};

export const createContractPermissionsJSON = ({
  hashOrGroupType,
  methods = [],
}: {
  readonly hashOrGroupType: 'uint160' | 'ecpoint' | undefined;
  readonly methods: readonly string[];
}): ContractPermissionsJSON => ({ contract: createContractPermissionDescriptorJSON({ hashOrGroupType }), methods });

export const createContractManifestJSON = ({
  groups = [createContractGroupJSON()],
  features = { storage: true, payable: true },
  abi = createContractAbiJSON(),
  permissions = [createContractPermissionsJSON({ hashOrGroupType: 'uint160', methods: ['method1'] })],
  trusts = [keys[0].scriptHashString],
  safeMethods = ['method1', 'method2'],
}: Partial<ContractManifestJSON> = {}): ContractManifestJSON => ({
  groups,
  features,
  abi,
  permissions,
  trusts,
  safeMethods,
});

export const createContractJSON = ({
  hash = keys[0].scriptHashString,
  script = Buffer.alloc(25).toString('hex'),
  manifest = createContractManifestJSON(),
}: Partial<ContractJSON> = {}): ContractJSON => ({ hash, script, manifest });

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

const createCosignerJSON = (options: Partial<CosignerJSON> = {}): CosignerJSON => ({
  account: keys[0].scriptHashString,
  scopes: 'CalledByEntry',
  ...options,
});

const createTransactionJSON = (options: Partial<TransactionJSON> = {}): TransactionJSON => ({
  hash: data.hash256s.a,
  size: 256,
  version: 0,
  nonce: 924105227,
  sender: keys[0].address,
  script: Buffer.alloc(25).toString('hex'),
  valid_until_block: 5000000,
  sys_fee: '10',
  net_fee: '5',
  cosigners: [createCosignerJSON()],
  witnesses: [createWitnessJSON()],
  attributes: [
    createUInt160AttributeJSON(),
    createUInt256AttributeJSON(),
    createBufferAttributeJSON(),
    createECPointAttributeJSON(),
  ],
  ...options,
});

const createTransactionReceiptJSON = (options: Partial<TransactionReceiptJSON> = {}): TransactionReceiptJSON => ({
  blockHash: data.hash256s.b,
  blockTime: 1000000,
  transactionHash: data.hash256s.a,
  confirmations: 999999,
  ...options,
});

const createConfirmedTransactionJSON = (options: Partial<ConfirmedTransactionJSON> = {}): ConfirmedTransactionJSON => ({
  ...createTransactionJSON(),
  ...createTransactionReceiptJSON(),
  ...options,
});

const createIntegerContractParameterJSON = (
  options: Partial<IntegerContractParameterJSON> = {},
): IntegerContractParameterJSON => ({
  type: 'Integer',
  value: '20',
  name: 'param',
  ...options,
});

const createInvocationResultSuccessJSON = (
  options: Partial<InvocationResultSuccessJSON> = {},
): InvocationResultSuccessJSON => ({
  state: 'HALT',
  gas_consumed: '20',
  stack: [createIntegerContractParameterJSON()],
  script: Buffer.alloc(25).toString('hex'),
  ...options,
});

const createInvocationResultErrorJSON = (
  options: Partial<InvocationResultErrorJSON> = {},
): InvocationResultErrorJSON => ({
  state: 'FAULT',
  gas_consumed: '20',
  stack: [createIntegerContractParameterJSON()],
  script: Buffer.alloc(25).toString('hex'),
  ...options,
});

const createCallReceiptJSON = (options: Partial<CallReceiptJSON> = {}): CallReceiptJSON => ({
  result: createInvocationResultSuccessJSON(),
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
  time: `${data.timestamps.past}`,
  index: 10,
  nextconsensus: keys[0].address,
  size: 256,
  confirmations: 10,
  witnesses: [createWitnessJSON()],
  nextblockhash: data.hash256s.d,
  ...options,
});

const createConsensusDataJSON = (options: Partial<ConsensusDataJSON> = {}): ConsensusDataJSON => ({
  primary: 123,
  nonce: '85f4dec73801b878',
  ...options,
});

const createBlockJSON = (options: Partial<BlockJSON> = {}): BlockJSON => ({
  ...createHeaderJSON(),
  tx: [createConfirmedTransactionJSON()],
  consensus_data: createConsensusDataJSON(),
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

const createArrayContractParameterJSON = (
  options: Partial<ArrayContractParameterJSON> = {},
): ArrayContractParameterJSON => ({
  type: 'Array',
  name: 'param',
  value: [createBooleanContractParameterJSON()],
  ...options,
});

const createBooleanContractParameterJSON = (
  options: Partial<BooleanContractParameterJSON> = {},
): BooleanContractParameterJSON => ({
  type: 'Boolean',
  value: true,
  name: 'param',
  ...options,
});

const createByteArrayContractParameterJSON = (
  options: Partial<ByteArrayContractParameterJSON> = {},
): ByteArrayContractParameterJSON => ({
  type: 'ByteArray',
  value: Buffer.alloc(1, 0xff).toString(),
  name: 'param',
  ...options,
});

const createHash160ContractParameterJSON = (
  options: Partial<Hash160ContractParameterJSON> = {},
): Hash160ContractParameterJSON => ({
  type: 'Hash160',
  value: keys[0].scriptHashString,
  name: 'param',
  ...options,
});

const createHash256ContractParameterJSON = (
  options: Partial<Hash256ContractParameterJSON> = {},
): Hash256ContractParameterJSON => ({
  type: 'Hash256',
  value: data.hash256s.a,
  name: 'param',
  ...options,
});

const createInteropInterfaceContractParameterJSON = (
  options: Partial<InteropInterfaceContractParameterJSON> = {},
): InteropInterfaceContractParameterJSON => ({
  type: 'InteropInterface' as 'InteropInterface',
  name: 'param',
  ...options,
});

const createMapContractParameterJSON = (options: Partial<MapContractParameterJSON> = {}): MapContractParameterJSON => ({
  type: 'Map',
  name: 'param',
  value: [[createIntegerContractParameterJSON(), createBooleanContractParameterJSON()] as const],
  ...options,
});

const createPublicKeyContractParameterJSON = (
  options: Partial<PublicKeyContractParameterJSON> = {},
): PublicKeyContractParameterJSON => ({
  type: 'PublicKey',
  value: keys[0].publicKeyString,
  name: 'param',
  ...options,
});

const createSignatureContractParameterJSON = (
  options: Partial<SignatureContractParameterJSON> = {},
): SignatureContractParameterJSON => ({
  type: 'Signature',
  value: data.signatures.a,
  name: 'param',
  ...options,
});

const createStringContractParameterJSON = (
  options: Partial<StringContractParameterJSON> = {},
): StringContractParameterJSON => ({
  type: 'String',
  value: 'test',
  name: 'param',
  ...options,
});

const createVoidContractParameterJSON = (
  options: Partial<VoidContractParameterJSON> = {},
): VoidContractParameterJSON => ({
  type: 'Void',
  name: 'param',
  ...options,
});

const createValidatorJSON = (options: Partial<ValidatorJSON> = {}): ValidatorJSON => ({
  active: true,
  publicKey: keys[0].publicKeyString,
  votes: '10000',
  ...options,
});

const createVersionJSON = (options: Partial<VersionJSON> = {}): VersionJSON => ({
  tcpPort: 20333,
  wsPort: 20334,
  nonce: 637639630,
  useragent: '/Neo:3.0.0-preview1/',
  ...options,
});

const createPluginJSON = (options: Partial<PluginJSON> = {}): PluginJSON => ({
  name: 'RpcSecurity',
  version: '3.0.0.0',
  interfaces: ['IRpcPlugin'],
  ...options,
});

export const contractParamDeclaration: { readonly [key: string]: ContractParameterDeclaration } = {
  boolean: {
    type: 'Boolean',
    name: 'param',
  },
  buffer: {
    type: 'Buffer',
    name: 'param',
  },
  hash160: {
    type: 'Hash160',
    name: 'param',
  },
  hash256: {
    type: 'Hash256',
    name: 'param',
  },
  array: {
    type: 'Array',
    name: 'param',
  },
  integer: {
    type: 'Integer',
    name: 'param',
  },
  interopInterface: {
    type: 'InteropInterface',
    name: 'param',
  },
  map: {
    type: 'Map',
    name: 'param',
  },
  publicKey: {
    type: 'PublicKey',
    name: 'param',
  },
  signature: {
    type: 'Signature',
    name: 'param',
  },
  string: {
    type: 'String',
    name: 'param',
  },
  void: {
    type: 'Void',
    name: 'param',
  },
};

export const createContractEvent = ({
  parameters = [contractParamDeclaration.boolean],
  name = 'event',
}: Partial<ContractEvent> = {}): ContractEvent => ({
  name,
  parameters,
});

export const createContractMethodDescriptor = ({
  parameters = [contractParamDeclaration.boolean],
  returnType = 'Void',
  name = 'event',
}: Partial<ContractMethodDescriptor> = {}): ContractMethodDescriptor => ({
  name,
  parameters,
  returnType,
});

export const createContractAbi = ({
  methods = [createContractMethodDescriptor()],
  events = [createContractEvent()],
  entryPoint = createContractMethodDescriptor(),
  hash = keys[0].scriptHash,
}: Partial<ContractAbi> = {}): ContractAbi => ({ hash, entryPoint, methods, events });

export const createContractGroup = ({
  publicKey = keys[0].publicKey,
  signature = 'ccaab040cc25021c91567b75db4778853441869157b8f6aad960cdcf1069812480027a528ca9b98e2205027de20696f848cf81824eeb7af1d5110870870ceb67',
}: Partial<ContractGroup> = {}) => ({ publicKey, signature });

export const createWildcard = <T>(wildcard?: readonly T[]): WildcardContainer<T> => ({ data: wildcard });

export const createContractPermissionDescriptor = ({
  hashOrGroupType,
}: {
  readonly hashOrGroupType: 'uint160' | 'ecpoint' | undefined;
}): ContractPermissionDescriptor => {
  if (hashOrGroupType === 'uint160') {
    return { hashOrGroup: keys[0].scriptHash };
  }
  if (hashOrGroupType === 'ecpoint') {
    return { hashOrGroup: keys[0].publicKey };
  }

  return { hashOrGroup: undefined };
};

export const createContractPermissions = ({
  hashOrGroupType,
  methods = [],
}: {
  readonly hashOrGroupType: 'uint160' | 'ecpoint' | undefined;
  readonly methods?: readonly string[];
}): ContractPermissions => ({
  contract: createContractPermissionDescriptor({ hashOrGroupType }),
  methods: createWildcard<string>(methods),
});

export const createContractManifest = ({
  groups = [createContractGroup()],
  features = { storage: true, payable: true },
  abi = createContractAbi(),
  permissions = [createContractPermissions({ hashOrGroupType: 'uint160', methods: ['method1'] })],
  trusts = createWildcard([keys[0].scriptHash]),
  safeMethods = createWildcard(['method1', 'method2']),
}: Partial<ContractManifest> = {}): ContractManifest => ({ groups, features, abi, permissions, trusts, safeMethods });

export const createContract = ({
  address = keys[0].address,
  script = Buffer.alloc(25).toString('hex'),
  manifest = createContractManifest(),
}: Partial<Contract> = {}): Contract => ({ address, script, manifest });

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

const createCosigner = (options: Partial<Cosigner> = {}): Cosigner => ({
  account: keys[0].address,
  scopes: 'CalledByEntry',
  ...options,
});

const createTransaction = (options: Partial<Transaction> = {}): Transaction => ({
  hash: data.hash256s.a,
  size: 256,
  version: 0,
  nonce: 924105227,
  sender: keys[0].address,
  script: Buffer.alloc(25).toString('hex'),
  validUntilBlock: 5000000,
  systemFee: new BigNumber('10'),
  networkFee: new BigNumber('5'),
  cosigners: [createCosigner()],
  witnesses: [createWitness()],
  attributes: [createAddressAttribute(), createHash256Attribute(), createBufferAttribute(), createPublicKeyAttribute()],
  ...options,
});

const createTransactionReceipt = (options: Partial<TransactionReceipt> = {}): TransactionReceipt => ({
  blockHash: data.hash256s.b,
  blockTime: 1000000,
  transactionHash: data.hash256s.a,
  confirmations: 999999,
  ...options,
});

const createConfirmedTransaction = (options: Partial<ConfirmedTransaction> = {}): ConfirmedTransaction => ({
  ...createTransaction(),
  ...createTransactionReceipt(),
  ...options,
});

const createAddressContractParameter = (options: Partial<AddressContractParameter> = {}): AddressContractParameter => ({
  type: 'Address',
  value: keys[0].address,
  name: 'param',
  ...options,
});

const createStringContractParameter = (options: Partial<StringContractParameter> = {}): StringContractParameter => ({
  type: 'String',
  value: 'transfer',
  name: 'param',
  ...options,
});

const createIntegerContractParameter = (options: Partial<IntegerContractParameter> = {}): IntegerContractParameter => ({
  type: 'Integer',
  value: new BN(20),
  name: 'param',
  ...options,
});

const createBooleanContractParameter = (options: Partial<BooleanContractParameter> = {}): BooleanContractParameter => ({
  type: 'Boolean',
  value: true,
  name: 'param',
  ...options,
});

const createRawInvocationResultError = (options: Partial<RawInvocationResultError> = {}): RawInvocationResultError => ({
  state: 'FAULT',
  gasConsumed: new BigNumber('10'),
  stack: [createIntegerContractParameter()],
  script: Buffer.alloc(25).toString('hex'),
  ...options,
});

const createRawInvocationResultSuccess = (
  options: Partial<RawInvocationResultSuccess> = {},
): RawInvocationResultSuccess => ({
  state: 'HALT',
  gasConsumed: new BigNumber('10'),
  stack: [createIntegerContractParameter()],
  script: Buffer.alloc(25).toString('hex'),
  ...options,
});

const createInvocationResultError = (options: Partial<InvocationResultError> = {}): InvocationResultError => ({
  state: 'FAULT',
  gasConsumed: new BigNumber('20'),
  script: Buffer.alloc(25).toString('hex'),
  ...options,
});

const createInvocationResultSuccess = (
  options: Partial<InvocationResultSuccess<boolean>> = {},
): InvocationResultSuccess<boolean> => ({
  state: 'HALT',
  gasConsumed: new BigNumber('20'),
  value: true,
  script: Buffer.alloc(25).toString('hex'),
  ...options,
});

const createRawCallReceipt = (options: Partial<RawCallReceipt> = {}): RawCallReceipt => ({
  result: createRawInvocationResultSuccess(),
  actions: [createRawNotification(), createRawLog()],
  ...options,
});

// const createRawInvokeReceipt = (options: Partial<RawInvokeReceipt> = {}): RawInvokeReceipt => ({
//   blockIndex: 10,
//   blockHash: data.hash256s.a,
//   transactionIndex: 1,
//   globalIndex: new BigNumber(11),
//   result: createRawInvocationResultSuccess(),
//   actions: [createRawNotification(), createRawLog()],
//   ...options,
// });

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

// const createAddressABIParameter = (options: Partial<AddressABIParameter> = {}): AddressABIParameter => ({
//   type: 'Address',
//   name: 'from',
//   ...options,
// });

// const createIntegerABIParameter = (options: Partial<IntegerABIParameter> = {}): IntegerABIParameter => ({
//   type: 'Integer',
//   name: 'amount',
//   decimals: 8,
//   ...options,
// });

// const createDeployABIFunction = (options: Partial<ContractMethodDescriptor> = {}): ContractMethodDescriptor => ({
//   name: 'deploy',
//   parameters: [],
//   returnType: { type: 'Boolean' },
//   ...options,
// });

// const createStringABIReturn = (): StringABIReturn => ({
//   type: 'String',
// });

// const createIntegerABIReturn = (): IntegerABIReturn => ({
//   type: 'Integer',
//   decimals: 0,
// });

// const createStringABIParameter = (options: Partial<StringABIParameter> = {}): StringABIParameter => ({
//   type: 'String',
//   name: 'foo',
//   ...options,
// });

// const createABI = (options: Partial<ABI> = {}): ABI => ({
//   ...nep5.abi(8),
//   ...options,
// });

// const createForwardValue = (options: Partial<ForwardValue> = {}): ForwardValue =>
//   // tslint:disable-next-line:no-object-literal-type-assertion
//   ({
//     name: 'foo',
//     converted: true,
//     param: true,
//     ...options,
//   } as ForwardValue);

// const createABIFunction = (options: Partial<ABIFunction> = {}): ABIFunction => ({
//   name: 'foo',
//   parameters: [],
//   returnType: { type: 'Boolean' },
//   send: false,
//   receive: false,
//   sendUnsafe: false,
//   refundAssets: false,
//   completeSend: false,
//   claim: false,
//   ...options,
// });

// const createSmartContractDefinition = (options: Partial<SmartContractDefinition> = {}): SmartContractDefinition => ({
//   networks: {
//     main: {
//       address: keys[0].address,
//     },
//   },
//   abi: createABI(),
//   ...options,
// });

const createTransactionResult = (options: Partial<TransactionResult> = {}): TransactionResult => ({
  transaction: createTransaction(),
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
  time: new BigNumber(100000),
  index: 10,
  nextConsensus: keys[0].address,
  size: 256,
  confirmations: 10,
  witnesses: [createWitness()],
  nextBlockHash: data.hash256s.d,
  ...options,
});

const createConsensusData = (options: Partial<ConsensusData> = {}): ConsensusData => ({
  primaryIndex: 123,
  nonce: 'ab3f',
  ...options,
});

const createBlock = (options: Partial<Block> = {}): Block => ({
  ...createHeader(),
  transactions: [createConfirmedTransaction()],
  consensusData: createConsensusData(),
  ...options,
});

export const factory = {
  createContractJSON,
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
  createInvocationResultSuccessJSON,
  createInvocationResultErrorJSON,
  createContractManifestJSON,
  createContractAbiJSON,
  createContractMethodDescriptorJSON,
  contractParamDeclarationJSON,
  createContract,
  createTransactionJSON,
  createCallReceiptJSON,
  createLogActionJSON,
  createHeaderJSON,
  createValidatorJSON,
  createVersionJSON,
  createPluginJSON,
  createVerifyScriptResultJSON,
  createConfirmedTransactionJSON,
  createVerifyTransactionResultJSON,
  createBlockJSON,
  createPeerJSON,
  createNetworkSettingsJSON,
  createStorageItemJSON,
  createInvocationResultSuccess,
  createInvocationResultError,
  createRawCallReceipt,
  createNetworkSettings,
  createBufferAttribute,
  createAddressAttribute,
  createConfirmedTransaction,
  createHash256Attribute,
  createPublicKeyAttribute,
  createWitness,
  createLockedWallet,
  createTransaction,
  createUnlockedWallet,
  createOtherWallet,
  createTransfer,
  createRawInvocationResultError,
  createRawInvocationResultSuccess,
  createRawLog,
  createRawNotification,
  createAddressContractParameter,
  createIntegerContractParameter,
  createStringContractParameter,
  createRawTransferNotification,
  createBooleanContractParameter,
  createUserAccount,
  createUserAccountID,
  createTransactionResult,
  createAccount,
  createBlock,
  createHeader,
};
