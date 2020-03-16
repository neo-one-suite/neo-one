import {
  ActionJSON,
  Attribute,
  AttributeJSON,
  Block,
  BlockJSON,
  CallReceiptJSON,
  common,
  ConfirmedTransaction,
  ConfirmedTransactionJSON,
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
  ContractParameter,
  ContractParameterDeclaration,
  ContractParameterDeclarationJSON,
  ContractParameterJSON,
  ContractParameterType,
  ContractParameterTypeJSON,
  ContractPermissionDescriptor,
  ContractPermissionDescriptorJSON,
  ContractPermissions,
  ContractPermissionsJSON,
  Cosigner,
  CosignerJSON,
  InvocationResultJSON,
  JSONHelper,
  NetworkSettings,
  NetworkSettingsJSON,
  RawAction,
  RawCallReceipt,
  RawInvocationResult,
  RawStorageChange,
  RelayTransactionResult,
  RelayTransactionResultJSON,
  scriptHashToAddress,
  StorageChangeJSON,
  StorageItem,
  StorageItemJSON,
  Transaction,
  TransactionJSON,
  UInt160,
  VerifyTransactionResult,
  VerifyTransactionResultJSON,
  WildcardContainer,
  WildcardContainerJSON,
} from '@neo-one/client-common';
import { utils } from '@neo-one/utils';
import BigNumber from 'bignumber.js';
import { BN } from 'bn.js';
import { InvalidContractPermissionDescriptorError } from '../errors';
export function convertStorageItem(storageItem: StorageItemJSON): StorageItem {
  return {
    address: scriptHashToAddress(storageItem.hash),
    key: storageItem.key,
    value: storageItem.value,
  };
}

export function convertAttributes(attributes: readonly AttributeJSON[]): readonly Attribute[] {
  return attributes.map((attribute) => ({
    // tslint:disable-next-line no-any
    usage: attribute.usage as any,
    data: attribute.usage === 'Script' ? scriptHashToAddress(attribute.data) : attribute.data,
  }));
}

export function convertCosigners(cosigners: readonly CosignerJSON[]): readonly Cosigner[] {
  return cosigners.map((cosigner) => ({
    account: cosigner.account,
    scopes: cosigner.scopes,
    allowedContracts: cosigner.allowedContracts,
    allowedGroups:
      cosigner.allowedGroups === undefined
        ? undefined
        : cosigner.allowedGroups.map((group) => common.hexToECPoint(group)),
  }));
}

export function convertTransaction(transaction: TransactionJSON): Transaction {
  return {
    hash: transaction.hash,
    size: transaction.size,
    version: transaction.version,
    nonce: transaction.nonce,
    sender: transaction.sender,
    systemFee: new BigNumber(transaction.sys_fee),
    networkFee: new BigNumber(transaction.net_fee),
    validUntilBlock: transaction.valid_until_block,
    attributes: convertAttributes(transaction.attributes),
    witnesses: transaction.witnesses,
    cosigners: convertCosigners(transaction.cosigners),
    script: transaction.script,
  };
}

export function convertConfirmedTransaction(transaction: ConfirmedTransactionJSON): ConfirmedTransaction {
  return {
    ...convertTransaction(transaction),
    blockHash: transaction.blockHash,
    blockTime: transaction.blockTime,
    transactionHash: transaction.hash,
    confirmations: transaction.confirmations,
  };
}

export function convertBlock(block: BlockJSON): Block {
  return {
    version: block.version,
    hash: block.hash,
    previousBlockHash: block.previousblockhash,
    merkleRoot: block.merkleroot,
    time: new BigNumber(block.time),
    index: block.index,
    nextConsensus: block.nextconsensus,
    size: block.size,
    transactions: block.tx.map(convertConfirmedTransaction),
    witnesses: block.witnesses,
    confirmations: block.confirmations,
    nextBlockHash: block.nextblockhash,
    consensusData: {
      primaryIndex: block.consensus_data.primary,
      nonce: block.consensus_data.nonce,
    },
  };
}

export function convertContractEvent(event: ContractEventJSON): ContractEvent {
  return {
    name: event.name,
    parameters: event.parameters.map(convertContractParameterDeclaration),
  };
}

export function convertContractMethodDescriptor(method: ContractMethodDescriptorJSON): ContractMethodDescriptor {
  return {
    name: method.name,
    parameters: method.parameters.map(convertContractParameterDeclaration),
    returnType: convertContractParameterType(method.returnType),
  };
}

export function convertContractAbi(abi: ContractAbiJSON): ContractAbi {
  return {
    hash: common.hexToUInt160(abi.hash),
    entryPoint: convertContractMethodDescriptor(abi.entryPoint),
    methods: abi.methods.map(convertContractMethodDescriptor),
    events: abi.events.map(convertContractEvent),
  };
}

export function convertContractGroup(group: ContractGroupJSON): ContractGroup {
  return {
    publicKey: common.hexToECPoint(group.publicKey),
    signature: group.signature,
  };
}

export function convertContractPermissionDescriptor(
  permissionDescriptor: ContractPermissionDescriptorJSON,
): ContractPermissionDescriptor {
  if (permissionDescriptor === '*') {
    return { hashOrGroup: undefined };
  }

  try {
    return { hashOrGroup: common.hexToUInt160(permissionDescriptor) };
  } catch {
    // do nothing
  }

  try {
    return { hashOrGroup: common.hexToECPoint(permissionDescriptor) };
  } catch {
    // do nothing
  }

  throw new InvalidContractPermissionDescriptorError(permissionDescriptor);
}

export function convertWildcardContainer<T, U>(
  wildcard: WildcardContainerJSON<T>,
  conversion: (data: T) => U,
): WildcardContainer<U> {
  return wildcard === '*' ? { data: undefined } : { data: wildcard.map(conversion) };
}

export function convertContractPermissions(permission: ContractPermissionsJSON): ContractPermissions {
  return {
    contract: convertContractPermissionDescriptor(permission.contract),
    methods: convertWildcardContainer<string, string>(permission.methods, (data) => data),
  };
}

export function convertContractManifest(manifest: ContractManifestJSON): ContractManifest {
  return {
    abi: convertContractAbi(manifest.abi),
    groups: manifest.groups.map(convertContractGroup),
    permissions: manifest.permissions.map(convertContractPermissions),
    trusts: convertWildcardContainer<string, UInt160>(manifest.trusts, common.hexToUInt160),
    safeMethods: convertWildcardContainer<string, string>(manifest.safeMethods, (data) => data),
    features: manifest.features,
  };
}

export function convertContract(contract: ContractJSON): Contract {
  return {
    address: scriptHashToAddress(contract.hash),
    script: contract.script,
    manifest: convertContractManifest(contract.manifest),
  };
}

export function convertContractParameterType(param: ContractParameterTypeJSON): ContractParameterType {
  switch (param) {
    case 'Signature':
      return 'Signature';
    case 'Boolean':
      return 'Boolean';
    case 'Integer':
      return 'Integer';
    case 'Hash160':
      return 'Address';
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

export function convertContractParameterDeclaration(
  param: ContractParameterDeclarationJSON,
): ContractParameterDeclaration {
  return {
    type: convertContractParameterType(param.type),
    name: param.name,
  };
}

export function convertStorageChange(storageChange: StorageChangeJSON): RawStorageChange {
  if (storageChange.type === 'Add') {
    return {
      type: 'Add',
      address: scriptHashToAddress(storageChange.hash),
      key: storageChange.key,
      value: storageChange.value,
    };
  }

  if (storageChange.type === 'Modify') {
    return {
      type: 'Modify',
      address: scriptHashToAddress(storageChange.hash),
      key: storageChange.key,
      value: storageChange.value,
    };
  }

  return {
    type: 'Delete',
    address: scriptHashToAddress(storageChange.hash),
    key: storageChange.key,
  };
}

export function convertRelayTransactionResult(result: RelayTransactionResultJSON): RelayTransactionResult {
  const transaction = convertTransaction(result.transaction);
  const verifyResult =
    result.verifyResult === undefined ? undefined : convertVerifyResult(transaction.hash, result.verifyResult);

  return { transaction, verifyResult };
}

/* istanbul ignore next */
export function convertVerifyResult(
  transactionHash: string,
  result: VerifyTransactionResultJSON,
): VerifyTransactionResult {
  return {
    verifications: result.verifications.map((verification) => ({
      failureMessage: verification.failureMessage,
      witness: verification.witness,
      address: scriptHashToAddress(verification.hash),
      actions: verification.actions.map((action, idx) =>
        convertAction(
          common.uInt256ToString(common.bufferToUInt256(Buffer.alloc(32, 0))),
          -1,
          transactionHash,
          -1,
          idx,
          action,
        ),
      ),
    })),
  };
}

export function convertCallReceipt(receipt: CallReceiptJSON): RawCallReceipt {
  return {
    result: convertInvocationResult(receipt.result),
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
      version: action.version,
      blockIndex,
      blockHash,
      transactionIndex,
      transactionHash,
      index,
      globalIndex: JSONHelper.readUInt64(action.index),
      address: scriptHashToAddress(action.scriptHash),
      message: action.message,
    };
  }

  return {
    type: 'Notification',
    version: action.version,
    blockIndex,
    blockHash,
    transactionIndex,
    transactionHash,
    index,
    globalIndex: JSONHelper.readUInt64(action.index),
    address: scriptHashToAddress(action.scriptHash),
    args: convertContractParameters(action.args),
  };
}

export function convertInvocationResult(result: InvocationResultJSON): RawInvocationResult {
  return {
    state: result.state,
    gasConsumed: new BigNumber(result.gas_consumed),
    stack: convertContractParameters(result.stack),
    script: result.script,
  };
}

export function convertContractParameters(parameters: readonly ContractParameterJSON[]): readonly ContractParameter[] {
  return parameters.map(convertContractParameter);
}

export function convertContractParameter(parameter: ContractParameterJSON): ContractParameter {
  switch (parameter.type) {
    case 'Array':
      return {
        type: 'Array',
        value: convertContractParameters(parameter.value),
        name: parameter.name,
      };
    case 'Boolean':
      return parameter;
    case 'ByteArray':
      return {
        type: 'Buffer',
        value: parameter.value,
        name: parameter.name,
      };
    case 'Hash160':
      return {
        type: 'Address',
        value: scriptHashToAddress(parameter.value),
        name: parameter.name,
      };
    case 'Hash256':
      return parameter;
    case 'Integer':
      return {
        type: 'Integer',
        value: new BN(parameter.value, 10),
        name: parameter.name,
      };
    case 'InteropInterface':
      return parameter;
    case 'Map':
      return {
        type: 'Map',
        value: parameter.value.map<readonly [ContractParameter, ContractParameter]>(
          ([key, val]) => [convertContractParameter(key), convertContractParameter(val)] as const,
        ),
        name: parameter.name,
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

export function convertNetworkSettings(settings: NetworkSettingsJSON): NetworkSettings {
  return {
    issueGASFee: new BigNumber(settings.issueGASFee),
  };
}
