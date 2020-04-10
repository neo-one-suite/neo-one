import {
  ActionJSON,
  AddressString,
  Asset,
  AssetJSON,
  AssetNameJSON,
  AssetType,
  AssetTypeJSON,
  CallReceiptJSON,
  ConfirmedTransaction,
  Contract,
  ContractJSON,
  InvocationResultJSON,
  Output,
  OutputJSON,
  PublicKeyString,
  RawAction,
  RawCallReceipt,
  RawInvocationResult,
  RawInvocationResultJSON,
  scriptHashToAddress,
  Transaction,
  TransactionJSON,
  VMState,
} from '@neo-one/client-common';
import BigNumber from 'bignumber.js';

interface AssetBase {
  readonly type: AssetType;
  readonly name: string;
  readonly amount: BigNumber;
  readonly precision: number;
  readonly owner: PublicKeyString;
  readonly admin: AddressString;
}

interface AssetBaseJSON {
  readonly type: AssetTypeJSON;
  readonly name: AssetNameJSON;
  readonly amount: string;
  readonly precision: number;
  readonly owner: string;
  readonly admin: string;
}

const verifyInvocationResultSuccess = (
  invocationResult: RawInvocationResult,
  invocationResultJSON: InvocationResultJSON | RawInvocationResultJSON,
) => {
  if (
    invocationResult.state !== 'HALT' ||
    (invocationResultJSON.state !== VMState.Halt && invocationResultJSON.state !== 'HALT')
  ) {
    throw new Error('For TS');
  }
  expect(invocationResult.gasConsumed.toString(10)).toEqual(invocationResultJSON.gas_consumed);
  expect(invocationResult.gasCost.toString(10)).toEqual(invocationResultJSON.gas_cost);
  const firstStack = invocationResult.stack[0];
  const firstStackJSON = invocationResultJSON.stack[0];
  if (firstStack.type !== 'Integer' || firstStackJSON.type !== 'Integer') {
    throw new Error('For TS');
  }
  expect(firstStack.value.toString(10)).toEqual(firstStackJSON.value);
};

const verifyDefaultActions = (
  actions: readonly RawAction[],
  actionsJSON: readonly ActionJSON[],
  blockIndex: number,
  blockHash: string,
  index: number,
  txid: string,
) => {
  expect(actions.length).toEqual(actionsJSON.length);
  const verifyAction = (actionResult: RawAction, action: ActionJSON, idx: number) => {
    expect(actionResult.type).toEqual(action.type);
    expect(actionResult.version).toEqual(action.version);
    expect(actionResult.blockIndex).toEqual(blockIndex);
    expect(actionResult.blockHash).toEqual(blockHash);
    expect(actionResult.transactionIndex).toEqual(index);
    expect(actionResult.transactionHash).toEqual(txid);
    expect(actionResult.index).toEqual(idx);
    expect(actionResult.globalIndex.toString(10)).toEqual(action.index);
    expect(actionResult.address).toEqual(scriptHashToAddress(action.scriptHash));
  };
  verifyAction(actions[0], actionsJSON[0], 0);
  verifyAction(actions[1], actionsJSON[1], 1);
};

const verifyAssetBase = (
  asset: AssetBase,
  assetJSON: AssetBaseJSON,
  toAssetType: string = assetJSON.type,
  name = assetJSON.name,
) => {
  expect(asset.type).toEqual(toAssetType);
  expect(asset.name).toEqual(name);
  expect(asset.amount.toString(10)).toEqual(assetJSON.amount);
  expect(asset.precision).toEqual(assetJSON.precision);
  expect(asset.owner).toEqual(assetJSON.owner);
  expect(asset.admin).toEqual(assetJSON.admin);
};

const verifyAsset = (
  asset: Asset,
  assetJSON: AssetJSON,
  toAssetType: string = assetJSON.type,
  name = assetJSON.name,
) => {
  verifyAssetBase(asset, assetJSON, toAssetType, name);
  expect(asset.hash).toEqual(assetJSON.id);
  expect(asset.available.toString(10)).toEqual(assetJSON.available);
  expect(asset.issuer).toEqual(assetJSON.issuer);
  expect(asset.expiration).toEqual(assetJSON.expiration);
  expect(asset.frozen).toEqual(assetJSON.frozen);
};

const verifyContract = (contract: Contract, contractJSON: ContractJSON, returnType = 'Buffer') => {
  expect(contract.version).toEqual(contractJSON.version);
  expect(contract.address).toEqual(scriptHashToAddress(contractJSON.hash));
  expect(contract.script).toEqual(contractJSON.script);
  expect(contract.parameters).toEqual(['Address', 'Buffer']);
  expect(contract.returnType).toEqual(returnType);
  expect(contract.name).toEqual(contractJSON.name);
  expect(contract.codeVersion).toEqual(contractJSON.code_version);
  expect(contract.author).toEqual(contractJSON.author);
  expect(contract.email).toEqual(contractJSON.email);
  expect(contract.description).toEqual(contractJSON.description);
  expect(contract.storage).toEqual(contractJSON.properties.storage);
  expect(contract.dynamicInvoke).toEqual(contractJSON.properties.dynamic_invoke);
  expect(contract.payable).toEqual(contractJSON.properties.payable);
};

const verifyOutput = (output: Output, outputJSON: OutputJSON) => {
  expect(output.asset).toEqual(outputJSON.asset);
  expect(output.value.toString(10)).toEqual(outputJSON.value);
  expect(output.address).toEqual(outputJSON.address);
};

const verifyTransactionBase = (transaction: Transaction, transactionJSON: TransactionJSON) => {
  expect(transaction.hash).toEqual(transactionJSON.txid);
  expect(transaction.size).toEqual(transactionJSON.size);
  expect(transaction.version).toEqual(transactionJSON.version);
  expect(transaction.attributes.length).toEqual(transactionJSON.attributes.length);
  expect(transaction.attributes[0].usage).toEqual(transactionJSON.attributes[0].usage);
  expect(transaction.attributes[0].data).toEqual(scriptHashToAddress(transactionJSON.attributes[0].data));
  expect(transaction.attributes[1].usage).toEqual(transactionJSON.attributes[1].usage);
  expect(transaction.attributes[1].data).toEqual(transactionJSON.attributes[1].data);
  expect(transaction.attributes[2].usage).toEqual(transactionJSON.attributes[2].usage);
  expect(transaction.attributes[2].data).toEqual(transactionJSON.attributes[2].data);
  expect(transaction.attributes[3].usage).toEqual(transactionJSON.attributes[3].usage);
  expect(transaction.attributes[3].data).toEqual(transactionJSON.attributes[3].data);
  expect(transaction.inputs.length).toEqual(transactionJSON.vin.length);
  expect(transaction.inputs[0].hash).toEqual(transactionJSON.vin[0].txid);
  expect(transaction.inputs[0].index).toEqual(transactionJSON.vin[0].vout);
  expect(transaction.outputs.length).toEqual(transactionJSON.vout.length);
  verifyOutput(transaction.outputs[0], transactionJSON.vout[0]);
  expect(transaction.scripts).toEqual(transactionJSON.scripts);
  expect(transaction.systemFee.toString(10)).toEqual(transactionJSON.sys_fee);
  expect(transaction.networkFee.toString(10)).toEqual(transactionJSON.net_fee);
};

const verifyClaimTransaction = (transaction: Transaction, transactionJSON: TransactionJSON) => {
  verifyTransactionBase(transaction, transactionJSON);
  if (transaction.type !== 'ClaimTransaction' || transactionJSON.type !== 'ClaimTransaction') {
    throw new Error('For TS');
  }
  expect(transaction.claims.length).toEqual(transactionJSON.claims.length);
  expect(transaction.claims[0].hash).toEqual(transactionJSON.claims[0].txid);
  expect(transaction.claims[0].index).toEqual(transactionJSON.claims[0].vout);
};

const verifyContractTransaction = (transaction: Transaction, transactionJSON: TransactionJSON) => {
  verifyTransactionBase(transaction, transactionJSON);
  expect(transaction.type).toEqual('ContractTransaction');
};

const verifyEnrollmentTransaction = (transaction: Transaction, transactionJSON: TransactionJSON) => {
  verifyTransactionBase(transaction, transactionJSON);
  if (transaction.type !== 'EnrollmentTransaction' || transactionJSON.type !== 'EnrollmentTransaction') {
    throw new Error('For TS');
  }
  expect(transaction.publicKey).toEqual(transactionJSON.pubkey);
};

const verifyInvocationTransaction = (transaction: Transaction, transactionJSON: TransactionJSON) => {
  verifyTransactionBase(transaction, transactionJSON);
  if (transaction.type !== 'InvocationTransaction' || transactionJSON.type !== 'InvocationTransaction') {
    throw new Error('For TS');
  }
  expect(transaction.script).toEqual(transactionJSON.script);
  expect(transaction.gas.toString(10)).toEqual(transactionJSON.gas);
};

const verifyIssueTransaction = (transaction: Transaction, transactionJSON: TransactionJSON) => {
  verifyTransactionBase(transaction, transactionJSON);
  expect(transaction.type).toEqual('IssueTransaction');
};

const verifyMinerTransaction = (transaction: Transaction, transactionJSON: TransactionJSON) => {
  verifyTransactionBase(transaction, transactionJSON);
  if (transaction.type !== 'MinerTransaction' || transactionJSON.type !== 'MinerTransaction') {
    throw new Error('For TS');
  }
  expect(transaction.nonce).toEqual(transactionJSON.nonce);
};

const verifyPublishTransaction = (transaction: Transaction, transactionJSON: TransactionJSON) => {
  verifyTransactionBase(transaction, transactionJSON);
  if (transaction.type !== 'PublishTransaction' || transactionJSON.type !== 'PublishTransaction') {
    throw new Error('For TS');
  }
  verifyContract(transaction.contract, transactionJSON.contract);
};

const verifyRegisterTransaction = (transaction: Transaction, transactionJSON: TransactionJSON) => {
  verifyTransactionBase(transaction, transactionJSON);
  if (transaction.type !== 'RegisterTransaction' || transactionJSON.type !== 'RegisterTransaction') {
    throw new Error('For TS');
  }
  verifyAssetBase(transaction.asset, transactionJSON.asset);
};

const verifyStateTransaction = (transaction: Transaction, transactionJSON: TransactionJSON) => {
  verifyTransactionBase(transaction, transactionJSON);
  expect(transaction.type).toEqual('StateTransaction');
};

const verifyConfirmedTransaction = (transaction: ConfirmedTransaction, transactionJSON: TransactionJSON) => {
  if (transactionJSON.data === undefined) {
    throw new Error('For TS');
  }

  expect(transaction.receipt.blockHash).toEqual(transactionJSON.data.blockHash);
  expect(transaction.receipt.blockIndex).toEqual(transactionJSON.data.blockIndex);
  expect(transaction.receipt.transactionIndex).toEqual(transactionJSON.data.transactionIndex);
  expect(transaction.receipt.globalIndex.toString(10)).toEqual(transactionJSON.data.globalIndex);
};

const verifyCallReceipt = (receipt: RawCallReceipt, receiptJSON: CallReceiptJSON) => {
  verifyInvocationResultSuccess(receipt.result, receiptJSON.result);
  verifyDefaultActions(
    receipt.actions,
    receiptJSON.actions,
    0,
    '0x​​​​​0000000000000000000000000000000000000000000000000000000000000000​​​​​',
    0,
    '0x​​​​​0000000000000000000000000000000000000000000000000000000000000000​​​​​',
  );
};

export const verifyDataProvider = {
  verifyInvocationResultSuccess,
  verifyDefaultActions,
  verifyAssetBase,
  verifyAsset,
  verifyContract,
  verifyOutput,
  verifyTransactionBase,
  verifyClaimTransaction,
  verifyContractTransaction,
  verifyEnrollmentTransaction,
  verifyInvocationTransaction,
  verifyIssueTransaction,
  verifyMinerTransaction,
  verifyPublishTransaction,
  verifyRegisterTransaction,
  verifyStateTransaction,
  verifyConfirmedTransaction,
  verifyCallReceipt,
};
