import {
  ActionJSON,
  ApplicationLogJSON,
  assertCallFlags,
  Attribute,
  AttributeJSON,
  AttributeTypeModel,
  Block,
  BlockDataJSON,
  BlockJSON,
  CallReceiptJSON,
  ConfirmedTransaction,
  ConfirmedTransactionJSON,
  Contract,
  ContractABI,
  ContractABIJSON,
  ContractEventDescriptor,
  ContractEventDescriptorJSON,
  ContractGroup,
  ContractGroupJSON,
  ContractJSON,
  ContractManifest,
  ContractManifestJSON,
  ContractMethodDescriptor,
  ContractMethodDescriptorJSON,
  ContractParameter,
  ContractParameterDefinition,
  ContractParameterDefinitionJSON,
  ContractParameterDefinitionType,
  ContractParameterJSON,
  ContractParameterTypeJSON,
  ContractPermission,
  ContractPermissionJSON,
  ExecutionJSON,
  ExecutionResultJSON,
  JSONHelper,
  LogJSON,
  MethodToken,
  MethodTokenJSON,
  NefFile,
  NefFileJSON,
  NetworkSettings,
  NetworkSettingsJSON,
  NotificationJSON,
  OracleResponseJSON,
  PolicyChangeJSON,
  RawAction,
  RawApplicationLogData,
  RawBlockData,
  RawCallReceipt,
  RawExecutionData,
  RawExecutionResult,
  RawPolicyChange,
  RawTransactionData,
  RawVMLog,
  RawVMNotification,
  RawVote,
  RelayTransactionResult,
  RelayTransactionResultJSON,
  scriptHashToAddress,
  Signer,
  SignerJSON,
  StorageItem,
  StorageItemJSON,
  toAttributeType,
  toVerifyResult,
  Transaction,
  TransactionDataJSON,
  TransactionJSON,
  TransactionReceipt,
  TransactionReceiptJSON,
  VerifyResultJSON,
  VerifyResultModel,
  VoteJSON,
  Witness,
  WitnessJSON,
} from '@neo-one/client-common';
import { utils } from '@neo-one/utils';
import BigNumber from 'bignumber.js';
import { BN } from 'bn.js';

export function convertCallReceipt(receipt: CallReceiptJSON): RawCallReceipt {
  return {
    result: convertExecutionResult(receipt.result),
    actions: receipt.actions.map((action, idx) =>
      convertAction(
        '0x​​​​​0000000000000000000000000000000000000000000000000000000000000000​​​​​',
        0,
        '0x​​​​​0000000000000000000000000000000000000000000000000000000000000000​​​​​',
        0,
        idx,
        action,
      ),
    ),
  };
}

export function convertTransactionData(data: TransactionDataJSON, transactionHash: string): RawTransactionData {
  return {
    ...convertTransactionReceipt(data),
    votes: data.votes.map(convertVote),
    policyChanges: data.policyChanges.map(convertPolicyChange),
    deletedContractHashes: data.deletedContractHashes,
    deployedContracts: data.deployedContracts.map(convertContract),
    updatedContracts: data.updatedContracts.map(convertContract),
    executionResult: convertExecutionResult(data.executionResult),
    actions: data.actions.map((action, idx) =>
      convertAction(data.blockHash, data.blockIndex, transactionHash, data.transactionIndex, idx, action),
    ),
  };
}

export function convertPolicyChange(change: PolicyChangeJSON): RawPolicyChange {
  const index = new BigNumber(change.index);
  switch (change.type) {
    case 'GasPerBlock':
      return {
        type: change.type,
        index,
        value: new BigNumber(change.value),
      };
    case 'RegisterPrice':
      return {
        type: change.type,
        index,
        value: new BigNumber(change.value),
      };
    case 'UnregisterCandidate':
      return {
        type: change.type,
        index,
        value: change.value,
      };
    case 'RegisterCandidate':
      return {
        type: change.type,
        index,
        value: change.value,
      };
    case 'RoleDesignation':
      return {
        type: change.type,
        index,
        value: change.value,
      };
    case 'FeePerByte':
      return {
        type: change.type,
        index,
        value: new BigNumber(change.value),
      };
    case 'ExecFeeFactor':
      return {
        type: change.type,
        index,
        value: change.value,
      };
    case 'StoragePrice':
      return {
        type: change.type,
        index,
        value: change.value,
      };
    case 'BlockAccount':
      return {
        type: change.type,
        index,
        value: change.value,
      };
    case 'UnblockAccount':
      return {
        type: change.type,
        index,
        value: change.value,
      };
    case 'MinimumDeploymentFee':
      return {
        type: change.type,
        index,
        value: new BigNumber(change.value),
      };
    default:
      utils.assertNever(change);
      throw new Error('For TS');
  }
}

export function convertVote(vote: VoteJSON): RawVote {
  return {
    account: vote.account,
    voteTo: vote.voteTo ?? undefined,
    balance: new BigNumber(vote.balance),
    index: new BigNumber(vote.index),
  };
}

export function convertExecutionResult(result: ExecutionResultJSON): RawExecutionResult {
  if (result.state === 'FAULT') {
    return {
      state: 'FAULT',
      gasConsumed: new BigNumber(result.gas_consumed),
      stack: convertContractParameters(result.stack),
      message: result.message,
    };
  }

  return {
    state: 'HALT',
    gasConsumed: new BigNumber(result.gas_consumed),
    stack: convertContractParameters(result.stack),
  };
}

export function convertContract(contract: ContractJSON): Contract {
  return {
    id: contract.id,
    updateCounter: contract.updatecounter,
    nef: convertNefFile(contract.nef),
    hash: contract.hash,
    manifest: convertContractManifest(contract.manifest),
  };
}

export function convertContractManifest(manifest: ContractManifestJSON): ContractManifest {
  return {
    name: manifest.name,
    groups: manifest.groups.map(convertContractGroup),
    supportedStandards: manifest.supportedstandards,
    abi: convertContractABI(manifest.abi),
    permissions: manifest.permissions.map(convertContractPermission),
    trusts: manifest.trusts,
    extra: manifest.extra,
  };
}

export function convertBase64Buffer(base64Str: string) {
  return Buffer.from(base64Str, 'base64').toString('hex');
}

export function convertNefFile(nef: NefFileJSON): NefFile {
  return {
    magic: nef.magic,
    compiler: nef.compiler,
    source: nef.source,
    tokens: nef.tokens.map(convertMethodToken),
    script: convertBase64Buffer(nef.script),
    checksum: nef.checksum,
  };
}

export function convertContractPermission(permission: ContractPermissionJSON): ContractPermission {
  return {
    contract: permission.contract,
    methods: permission.methods,
  };
}

export function convertContractGroup(group: ContractGroupJSON): ContractGroup {
  return {
    publicKey: group.publicKey,
    signature: convertBase64Buffer(group.signature),
  };
}

export function convertContractABI(abi: ContractABIJSON): ContractABI {
  return {
    methods: abi.methods.map(convertContractMethodDescriptor),
    events: abi.events.map(convertContractEventDescriptor),
  };
}

export function convertAction(
  blockHash: string,
  blockIndex: number,
  transactionHash: string,
  transactionIndex: number,
  index: number,
  action: ActionJSON,
): RawAction {
  if (action.type === 'Log') {
    return {
      type: 'Log',
      source: action.source,
      version: action.version,
      blockIndex,
      blockHash,
      transactionIndex,
      transactionHash,
      index,
      globalIndex: JSONHelper.readUInt64(action.index),
      address: scriptHashToAddress(action.scriptHash),
      message: action.message,
      position: action.position,
    };
  }

  return {
    type: 'Notification',
    source: action.source,
    version: action.version,
    blockIndex,
    blockHash,
    transactionIndex,
    transactionHash,
    index,
    globalIndex: JSONHelper.readUInt64(action.index),
    address: scriptHashToAddress(action.scriptHash),
    args: convertContractParameters(action.args),
    eventName: action.eventName,
  };
}

export function convertLog(log: LogJSON): RawVMLog {
  return {
    type: 'Log',
    containerHash: log.containerhash,
    callingScriptHash: log.callingscripthash,
    message: log.message,
    position: log.position,
  };
}

export function convertNotification(notification: NotificationJSON): RawVMNotification {
  return {
    type: 'Notification',
    scriptHash: notification.scripthash,
    eventName: notification.eventname,
    state: typeof notification.state === 'string' ? notification.state : convertContractParameters(notification.state),
  };
}

export function convertContractParameters(parameters: readonly ContractParameterJSON[]): readonly ContractParameter[] {
  return parameters.map(convertContractParameter);
}

export function convertContractParameter(parameter: ContractParameterJSON): ContractParameter {
  switch (parameter.type) {
    case 'Any':
      return {
        type: 'Any',
        value: undefined,
      };
    case 'Array':
      return {
        type: 'Array',
        value: convertContractParameters(parameter.value),
      };
    case 'Boolean':
      return parameter;
    case 'ByteArray':
      return {
        type: 'Buffer',
        value: convertBase64Buffer(parameter.value),
      };
    case 'Hash160':
      return {
        type: 'Hash160',
        value: scriptHashToAddress(parameter.value),
      };
    case 'Hash256':
      return parameter;
    case 'Integer':
      return {
        type: 'Integer',
        value: new BN(parameter.value, 10),
      };
    case 'InteropInterface':
      return parameter;
    case 'Map':
      return {
        type: 'Map',
        value: parameter.value.map<readonly [ContractParameter, ContractParameter]>(([key, val]) => [
          convertContractParameter(key),
          convertContractParameter(val),
        ]),
      };
    case 'PublicKey':
      return parameter;
    case 'Signature':
      return parameter;
    case 'String':
      return parameter;
    case 'Void':
      return parameter;
    /* istanbul ignore next */
    default:
      utils.assertNever(parameter);
      throw new Error('For TS');
  }
}

export function convertStorageItem(storageItem: StorageItemJSON): StorageItem {
  return {
    key: convertBase64Buffer(storageItem.key),
    value: convertBase64Buffer(storageItem.value),
  };
}

export function convertWitness(witness: WitnessJSON): Witness {
  return {
    invocation: convertBase64Buffer(witness.invocation),
    verification: convertBase64Buffer(witness.verification),
  };
}

export function convertBlock(block: BlockJSON): Block {
  return {
    version: block.version,
    hash: block.hash,
    previousBlockHash: block.previousblockhash,
    merkleRoot: block.merkleroot,
    time: new BigNumber(block.time),
    timeSeconds: block.timeseconds,
    nonce: new BigNumber(block.nonce, 16),
    primaryIndex: block.primary,
    index: block.index,
    nextConsensus: block.nextconsensus,
    witness: convertWitness(block.witnesses[0]),
    witnesses: block.witnesses.map(convertWitness),
    size: block.size,
    transactions: block.tx.map(convertConfirmedTransaction),
    blockData: convertBlockData(block, block.blockData),
  };
}

export function convertBlockData(block: BlockJSON, data?: BlockDataJSON): RawBlockData {
  if (data === undefined) {
    throw new Error('Expected to get block data');
  }

  return {
    blockActions: data.blockActions.map((action, idx) =>
      convertAction(
        block.hash,
        block.index,
        '0x​​​​​0000000000000000000000000000000000000000000000000000000000000000​​​​​',
        0,
        idx,
        action,
      ),
    ),
  };
}

export function convertTransaction(transaction: TransactionJSON): Transaction {
  return {
    version: transaction.version,
    nonce: transaction.nonce,
    sender: transaction.sender ? transaction.sender : undefined,
    hash: transaction.hash,
    size: transaction.size,
    validUntilBlock: transaction.validuntilblock,
    attributes: convertAttributes(transaction.attributes),
    systemFee: new BigNumber(transaction.sysfee),
    networkFee: new BigNumber(transaction.netfee),
    signers: transaction.signers.map(convertSigner),
    script: convertBase64Buffer(transaction.script),
    witnesses: transaction.witnesses.map(convertWitness),
  };
}

export function convertTransactionReceipt(receipt: TransactionReceiptJSON): TransactionReceipt {
  return {
    blockIndex: receipt.blockIndex,
    blockHash: receipt.blockHash,
    globalIndex: JSONHelper.readUInt64(receipt.globalIndex),
    transactionIndex: receipt.transactionIndex,
  };
}

export function convertSigner(signer: SignerJSON): Signer {
  return {
    account: scriptHashToAddress(signer.account),
    scopes: signer.scopes,
    allowedContracts: signer.allowedcontracts?.map(scriptHashToAddress),
    allowedGroups: signer.allowedgroups,
  };
}

export function convertConfirmedTransaction(transaction: ConfirmedTransactionJSON): ConfirmedTransaction {
  if (transaction.transactionData === undefined) {
    throw new Error('Unexpected undefined transactionData');
  }

  return {
    ...convertTransaction(transaction),
    transactionData: convertTransactionData(transaction.transactionData, transaction.hash),
  };
}

export function convertAttributes(attributes: readonly AttributeJSON[]): readonly Attribute[] {
  return attributes.map(convertAttribute);
}

export function convertAttribute(attribute: AttributeJSON): Attribute {
  const type = toAttributeType(attribute.type);
  switch (type) {
    case AttributeTypeModel.HighPriority:
      return {
        type,
      };
    case AttributeTypeModel.OracleResponse:
      const oracleJSON = attribute as OracleResponseJSON;

      return {
        type,
        id: new BigNumber(oracleJSON.id),
        code: oracleJSON.code,
        result: convertBase64Buffer(oracleJSON.result),
      };
    default:
      throw new Error(`Unexpected attribute type: ${type}`);
  }
}

export function convertMethodToken(token: MethodTokenJSON): MethodToken {
  return {
    hash: token.hash,
    method: token.method,
    paramCount: token.paramcount,
    hasReturnValue: token.hasreturnvalue,
    callFlags: assertCallFlags(token.callflags),
  };
}

export function convertContractEventDescriptor(event: ContractEventDescriptorJSON): ContractEventDescriptor {
  return {
    name: event.name,
    parameters: event.parameters.map(convertContractParameterDefinition),
  };
}

export function convertContractMethodDescriptor(method: ContractMethodDescriptorJSON): ContractMethodDescriptor {
  return {
    name: method.name,
    parameters: method.parameters.map(convertContractParameterDefinition),
    returnType: convertContractParameterType(method.returntype),
    offset: method.offset,
    safe: method.safe,
  };
}

export function convertContractParameterDefinition(
  param: ContractParameterDefinitionJSON,
): ContractParameterDefinition {
  return {
    type: convertContractParameterType(param.type),
    name: param.name,
  };
}

export function convertContractParameterType(param: ContractParameterTypeJSON): ContractParameterDefinitionType {
  switch (param) {
    case 'Any':
      return 'Any';
    case 'Signature':
      return 'Signature';
    case 'Boolean':
      return 'Boolean';
    case 'Integer':
      return 'Integer';
    case 'Hash160':
      return 'Hash160';
    case 'Hash256':
      return 'Hash256';
    case 'ByteArray':
      return 'Buffer';
    case 'PublicKey':
      return 'PublicKey';
    case 'String':
      return 'String';
    case 'Array':
      return 'Array';
    case 'Map':
      return 'Map';
    case 'InteropInterface':
      return 'InteropInterface';
    case 'Void':
      return 'Void';
    /* istanbul ignore next */
    default:
      utils.assertNever(param);
      throw new Error('For TS');
  }
}

export function convertExecution(data: ExecutionJSON): RawExecutionData {
  return {
    trigger: data.trigger,
    vmState: data.vmstate,
    gasConsumed: new BigNumber(data.gasconsumed),
    exception: data.exception === null ? undefined : data.exception,
    stack: typeof data.stack === 'string' ? data.stack : convertContractParameters(data.stack),
    notifications: data.notifications.map(convertNotification),
    logs: data.logs.map(convertLog),
  };
}

export function convertApplicationLogData(data: ApplicationLogJSON): RawApplicationLogData {
  return {
    txId: data.txid,
    blockHash: data.blockhash,
    executions: data.executions.map(convertExecution),
  };
}

export function convertNetworkSettings(settings: NetworkSettingsJSON): NetworkSettings {
  return {
    blockCount: settings.blockcount,
    decrementInterval: settings.decrementinterval,
    generationAmount: settings.generationamount,
    privateKeyVersion: settings.privatekeyversion,
    standbyvalidators: settings.standbyvalidators,
    network: settings.network,
    maxValidUntilBlockIncrement: settings.maxvaliduntilblockincrement,
    addressVersion: settings.addressversion,
    standbyCommittee: settings.standbycommittee,
    committeeMemberscount: settings.committeememberscount,
    validatorsCount: settings.validatorscount,
    millisecondsPerBlock: settings.millisecondsperblock,
    memoryPoolMaxTransactions: settings.memorypoolmaxtransactions,
  };
}

export function convertRelayTransactionResult(result: RelayTransactionResultJSON): RelayTransactionResult {
  const transaction = convertTransaction(result.transaction);
  const verifyResult = result.verifyResult === undefined ? undefined : convertVerifyResult(result.verifyResult);
  const failureMessage = result.failureMessage;

  return { transaction, verifyResult, failureMessage };
}

export function convertVerifyResult(result: VerifyResultJSON): VerifyResultModel {
  return toVerifyResult(result);
}
