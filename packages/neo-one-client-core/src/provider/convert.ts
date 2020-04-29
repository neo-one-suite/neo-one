import {
  ActionJSON,
  AddressString,
  Asset,
  AssetJSON,
  AssetType,
  AssetTypeJSON,
  Attribute,
  AttributeJSON,
  Block,
  BlockJSON,
  CallReceiptJSON,
  common,
  ConfirmedTransaction,
  Contract,
  ContractJSON,
  ContractParameter,
  ContractParameterJSON,
  ContractParameterType,
  ContractParameterTypeJSON,
  Input,
  InputJSON,
  InvocationDataJSON,
  InvocationResultJSON,
  InvocationTransactionJSON,
  JSONHelper,
  NeoPreviewContractJSON,
  NetworkSettings,
  NetworkSettingsJSON,
  Output,
  OutputJSON,
  RawAction,
  RawCallReceipt,
  RawInvocationData,
  RawInvocationResult,
  RawStorageChange,
  RelayTransactionResult,
  RelayTransactionResultJSON,
  scriptHashToAddress,
  StorageChangeJSON,
  StorageItem,
  StorageItemJSON,
  Transaction,
  TransactionBase,
  TransactionJSON,
  VerifyTransactionResult,
  VerifyTransactionResultJSON,
  VMState,
} from '@neo-one/client-common';
import { utils } from '@neo-one/utils';
import BigNumber from 'bignumber.js';
import { BN } from 'bn.js';

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
  if (result.state === VMState.Fault) {
    return {
      state: 'FAULT',
      gasConsumed: new BigNumber(result.gas_consumed),
      gasCost: new BigNumber(result.gas_cost),
      stack: convertContractParameters(result.stack),
      message: result.message,
    };
  }

  return {
    state: 'HALT',
    gasConsumed: new BigNumber(result.gas_consumed),
    gasCost: new BigNumber(result.gas_cost),
    stack: convertContractParameters(result.stack),
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
      };
    case 'Boolean':
      return parameter;
    case 'ByteArray':
      return {
        type: 'Buffer',
        value: parameter.value,
      };
    case 'Hash160':
      return {
        type: 'Address',
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
        value: parameter.value.map<readonly [ContractParameter, ContractParameter]>(
          ([key, val]) => [convertContractParameter(key), convertContractParameter(val)] as const,
        ),
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

export function convertStorageItem(storageItem: StorageItemJSON): StorageItem {
  return {
    address: scriptHashToAddress(storageItem.hash),
    key: storageItem.key,
    value: storageItem.value,
  };
}

export function convertBlock(
  block: BlockJSON,
  convertTransactionHelp: (transaction: TransactionJSON, block: BlockJSON) => ConfirmedTransaction,
): Block {
  return {
    version: block.version,
    hash: block.hash,
    previousBlockHash: block.previousblockhash,
    merkleRoot: block.merkleroot,
    time: block.time,
    index: block.index,
    nonce: block.nonce,
    nextConsensus: block.nextconsensus,
    script: block.script,
    size: block.size,
    transactions: block.tx.map((transaction) => convertTransactionHelp(transaction, block)),
  };
}

export function convertAssetType(assetType: AssetTypeJSON): AssetType {
  switch (assetType) {
    case 'CreditFlag':
      return 'Credit';
    case 'DutyFlag':
      return 'Duty';
    case 'GoverningToken':
      return 'Governing';
    case 'UtilityToken':
      return 'Utility';
    case 'Currency':
      return 'Currency';
    case 'Share':
      return 'Share';
    case 'Invoice':
      return 'Invoice';
    case 'Token':
      return 'Token';
    default:
      /* istanbul ignore next */
      utils.assertNever(assetType);
      /* istanbul ignore next */
      throw new Error('For TS');
  }
}

export function convertAsset(asset: AssetJSON): Asset {
  const assetName = asset.name;
  let name;
  if (Array.isArray(assetName)) {
    const enName = assetName.find(({ lang }) => lang === 'en');
    name = enName === undefined ? assetName[0].name : enName.name;
  } else {
    name = assetName;
  }

  return {
    hash: asset.id,
    type: convertAssetType(asset.type),
    name,
    amount: new BigNumber(asset.amount),
    available: new BigNumber(asset.available),
    precision: asset.precision,
    owner: asset.owner,
    admin: asset.admin,
    issuer: asset.issuer,
    expiration: asset.expiration,
    frozen: asset.frozen,
  };
}

export function convertContract(contractIn: ContractJSON): Contract {
  let contract = contractIn;
  // tslint:disable-next-line no-any
  if (typeof (contract.version as any) === 'string' && (contract.version as any).includes('preview')) {
    // tslint:disable-next-line no-any
    contract = convertPreviewContract(contract as any);
  }

  return {
    version: contract.version,
    address: scriptHashToAddress(contract.hash),
    script: contract.script,
    parameters: contract.parameters.map(convertContractParameterType),
    returnType: convertContractParameterType(contract.returntype),
    name: contract.name,
    codeVersion: contract.code_version,
    author: contract.author,
    email: contract.email,
    description: contract.description,
    storage: contract.properties.storage,
    dynamicInvoke: contract.properties.dynamic_invoke,
    payable: contract.properties.payable,
  };
}

export function convertPreviewContract(contract: NeoPreviewContractJSON): ContractJSON {
  return {
    version: 0,
    hash: contract.code.hash,
    script: contract.code.script,
    parameters: contract.code.parameters,
    returntype: contract.code.returntype,
    name: contract.name,
    code_version: 'preview',
    author: contract.author,
    email: contract.email,
    description: contract.description,
    properties: {
      storage: contract.needstorage,
      dynamic_invoke: false,
      payable: false,
    },
  };
}

export function convertInputs(inputs: readonly InputJSON[]): readonly Input[] {
  return inputs.map(convertInput);
}

export function convertInput(input: InputJSON): Input {
  return {
    hash: input.txid,
    index: input.vout,
  };
}

export function convertOutputs(outputs: readonly OutputJSON[]): readonly Output[] {
  return outputs.map(convertOutput);
}

export function convertOutput(output: OutputJSON): Output {
  return {
    asset: output.asset,
    address: output.address,
    value: new BigNumber(output.value),
  };
}

export function convertAttributes(attributes: readonly AttributeJSON[]): readonly Attribute[] {
  return attributes.map((attribute) => ({
    // tslint:disable-next-line no-any
    usage: attribute.usage as any,
    data: attribute.usage === 'Script' ? scriptHashToAddress(attribute.data) : attribute.data,
  }));
}

export function convertTransactionBase<Result extends Transaction | ConfirmedTransaction>(
  transaction: TransactionJSON,
  convertInvocation: (invocation: InvocationTransactionJSON, transactionBase: TransactionBase) => Result,
  convertTransactionHelp: (transaction: Transaction) => Result,
): Result {
  const transactionBase = {
    hash: transaction.txid,
    size: transaction.size,
    version: transaction.version,
    attributes: convertAttributes(transaction.attributes),
    inputs: convertInputs(transaction.vin),
    outputs: convertOutputs(transaction.vout),
    scripts: transaction.scripts,
    systemFee: new BigNumber(transaction.sys_fee),
    networkFee: new BigNumber(transaction.net_fee),
  };

  let converted: Transaction;
  switch (transaction.type) {
    case 'ClaimTransaction':
      converted = {
        ...transactionBase,
        type: 'ClaimTransaction',
        claims: convertInputs(transaction.claims),
      };
      break;
    case 'ContractTransaction':
      converted = {
        ...transactionBase,
        type: 'ContractTransaction',
      };
      break;
    case 'EnrollmentTransaction':
      converted = {
        ...transactionBase,
        type: 'EnrollmentTransaction',
        publicKey: transaction.pubkey,
      };
      break;
    case 'InvocationTransaction':
      return convertInvocation(transaction, transactionBase);
    case 'IssueTransaction':
      converted = {
        ...transactionBase,
        type: 'IssueTransaction',
      };
      break;
    case 'MinerTransaction':
      converted = {
        ...transactionBase,
        type: 'MinerTransaction',
        nonce: transaction.nonce,
      };
      break;
    case 'PublishTransaction':
      converted = {
        ...transactionBase,
        type: 'PublishTransaction',
        contract: convertContract(transaction.contract),
      };
      break;
    case 'RegisterTransaction':
      converted = {
        ...transactionBase,
        type: 'RegisterTransaction',
        asset: {
          type: convertAssetType(transaction.asset.type),
          name: Array.isArray(transaction.asset.name)
            ? /* istanbul ignore next */ transaction.asset.name[0].name
            : transaction.asset.name,
          amount: new BigNumber(transaction.asset.amount),
          precision: transaction.asset.precision,
          owner: transaction.asset.owner,
          admin: transaction.asset.admin,
        },
      };
      break;
    case 'StateTransaction':
      converted = {
        ...transactionBase,
        type: 'StateTransaction',
      };
      break;
    /* istanbul ignore next */
    default:
      utils.assertNever(transaction);
      throw new Error('For TS');
  }

  return convertTransactionHelp(converted);
}

export function convertTransaction(transaction: TransactionJSON): Transaction {
  return convertTransactionBase(
    transaction,
    (invocation, transactionBase) => ({
      ...transactionBase,
      type: 'InvocationTransaction',
      script: invocation.script,
      gas: new BigNumber(invocation.gas),
    }),
    /* istanbul ignore next */
    (converted) => converted,
  );
}

export function convertConfirmedTransaction(transaction: TransactionJSON): ConfirmedTransaction {
  if (transaction.data === undefined) {
    /* istanbul ignore next */
    throw new Error('Unexpected undefined data');
  }
  const data = {
    blockHash: transaction.data.blockHash,
    blockIndex: transaction.data.blockIndex,
    transactionIndex: transaction.data.transactionIndex,
    globalIndex: JSONHelper.readUInt64(transaction.data.globalIndex),
  };

  return convertTransactionBase(
    transaction,
    (invocation, transactionBase) => {
      /* istanbul ignore next */
      if (invocation.invocationData === undefined || transaction.data === undefined) {
        throw new Error('Unexpected undefined data');
      }

      const invocationData = convertInvocationData(
        invocation.invocationData,
        transaction.data.blockHash,
        transaction.data.blockIndex,
        transaction.txid,
        transaction.data.transactionIndex,
      );

      return {
        ...transactionBase,
        type: 'InvocationTransaction',
        script: invocation.script,
        gas: new BigNumber(invocation.gas),
        receipt: data,
        invocationData,
      };
    },
    // tslint:disable-next-line no-any
    (converted) => ({ ...converted, receipt: data } as any),
  );
}

export function convertInvocationData(
  data: InvocationDataJSON,
  blockHash: string,
  blockIndex: number,
  transactionHash: string,
  transactionIndex: number,
): RawInvocationData {
  return {
    result: convertInvocationResult(data.result),
    asset: data.asset === undefined ? data.asset : convertAsset(data.asset),
    contracts: data.contracts.map(convertContract),
    deletedContractAddresses: data.deletedContractHashes.map(scriptHashToAddress),
    migratedContractAddresses: data.migratedContractHashes.map<readonly [AddressString, AddressString]>(
      ([hash0, hash1]) => [scriptHashToAddress(hash0), scriptHashToAddress(hash1)] as const,
    ),
    actions: data.actions.map((action, idx) =>
      convertAction(blockHash, blockIndex, transactionHash, transactionIndex, idx, action),
    ),
    storageChanges: data.storageChanges.map(convertStorageChange),
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

export function convertNetworkSettings(settings: NetworkSettingsJSON): NetworkSettings {
  return {
    issueGASFee: new BigNumber(settings.issueGASFee),
  };
}
