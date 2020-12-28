import {
  ActionJSON,
  CallReceiptJSON,
  common,
  ConfirmedTransaction,
  Contract,
  ContractABI,
  ContractABIJSON,
  ContractGroup,
  ContractGroupJSON,
  ContractJSON,
  ContractManifest,
  ContractManifestJSON,
  ContractPermission,
  ContractPermissionDescriptor,
  ContractPermissionDescriptorJSON,
  ContractPermissionJSON,
  InvocationResultJSON,
  RawAction,
  RawCallReceipt,
  RawInvocationResult,
  RawInvocationResultJSON,
  scriptHashToAddress,
  Transaction,
  TransactionJSON,
} from '@neo-one/client-common';

const verifyInvocationResultSuccess = (
  invocationResult: RawInvocationResult,
  invocationResultJSON: InvocationResultJSON | RawInvocationResultJSON,
) => {
  if (invocationResult.state !== 'HALT' || invocationResultJSON.state !== 'HALT') {
    throw new Error('For TS');
  }
  expect(invocationResult.gasConsumed.toString(10)).toEqual(invocationResultJSON.gas_consumed);
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

const verifyAbi = (abi: ContractABI, abiJSON: ContractABIJSON) => {
  // TODO
  // expect(abi.returnType).toEqual(returnType);
};

const verifyContractPermissionDescriptor = (
  desc: ContractPermissionDescriptor,
  descJSON: ContractPermissionDescriptorJSON,
) => {
  expect(desc.isHash).toEqual(descJSON.isHash);
  expect(desc.isGroup).toEqual(descJSON.isGroup);
  expect(desc.isWildcard).toEqual(descJSON.isWildcard);
  // TODO: hashOrGroup
};

const verifyPermission = (permission: ContractPermission, permissionJSON: ContractPermissionJSON) => {
  verifyContractPermissionDescriptor(permission.contract, permissionJSON.contract);
  expect(permission.methods).toEqual(permissionJSON.methods);
};

const verifyGroup = (group: ContractGroup, groupJSON: ContractGroupJSON) => {
  expect(group.publicKey).toEqual(common.stringToECPoint(groupJSON.publicKey));
  // TODO: check signature
  expect(group.signature).toEqual(Buffer.from(groupJSON.signature, 'hex'));
};

const verifyManifest = (manifest: ContractManifest, manifestJSON: ContractManifestJSON) => {
  // TODO: hash
  expect(manifest.hash).toEqual(scriptHashToAddress(manifestJSON.hash));
  // TODO: hashHex
  expect(manifest.trusts).toEqual(manifestJSON.trusts);
  expect(manifest.supportedStandards).toEqual(manifestJSON.supportedStandards);
  expect(manifest.extra).toEqual(manifestJSON.extra);
  verifyAbi(manifest.abi, manifestJSON.abi);
  expect(manifest.permissions.length).toEqual(manifestJSON.permissions.length);
  manifest.permissions.forEach((perm, idx) => {
    verifyPermission(perm, manifestJSON.permissions[idx]);
  });
  expect(manifest.groups.length).toEqual(manifestJSON.groups.length);
  manifest.groups.forEach((group, idx) => {
    verifyGroup(group, manifestJSON.groups[idx]);
  });
};

const verifyContract = (contract: Contract, contractJSON: ContractJSON, returnType = 'Buffer') => {
  expect(contract.id).toEqual(contractJSON.id);
  expect(contract.script).toEqual(contractJSON.script);
  verifyManifest(contract.manifest, contractJSON.manifest);
};

const verifyTransaction = (transaction: Transaction, transactionJSON: TransactionJSON) => {
  expect(transaction.hash).toEqual(transactionJSON.hash);
  expect(transaction.size).toEqual(transactionJSON.size);
  expect(transaction.version).toEqual(transactionJSON.version);
  expect(transaction.nonce).toEqual(transactionJSON.nonce);
  expect(transaction.sender).toEqual(transactionJSON.sender);
  expect(transaction.systemFee.toString(10)).toEqual(transactionJSON.sysfee);
  expect(transaction.networkFee.toString(10)).toEqual(transactionJSON.netfee);
  expect(transaction.validUntilBlock).toEqual(transactionJSON.validuntilblock);
  expect(transaction.attributes.length).toEqual(transactionJSON.attributes.length);
  expect(transaction.attributes).toEqual(transactionJSON.attributes);
  expect(transaction.signers.length).toEqual(transactionJSON.signers.length);
  // TODO: signers
  expect(transaction.script).toEqual(transactionJSON.script);
  // TODO: check script and witnesses
  expect(transaction.witnesses).toEqual(transactionJSON.witnesses);
  // TODO: expect(transaction.data).toEqual(transactionJSON.data);
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
  verifyContract,
  verifyTransaction,
  verifyConfirmedTransaction,
  verifyCallReceipt,
};
