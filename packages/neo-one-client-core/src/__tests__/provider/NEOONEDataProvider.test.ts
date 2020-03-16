// tslint:disable no-object-mutation
import {
  ActionJSON,
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
  ContractParameterDeclaration,
  ContractParameterDeclarationJSON,
  ContractParameterType,
  ContractParameterTypeJSON,
  ContractPermissionDescriptor,
  ContractPermissionDescriptorJSON,
  ContractPermissions,
  ContractPermissionsJSON,
  Cosigner,
  CosignerJSON,
  InvocationResultJSON,
  RawAction,
  RawCallReceipt,
  RawInvocationResult,
  scriptHashToAddress,
  StorageItem,
  StorageItemJSON,
  Transaction,
  TransactionJSON,
  WildcardContainer,
  WildcardContainerJSON,
} from '@neo-one/client-common';
import { Modifiable, utils as commonUtils } from '@neo-one/utils';
import { toArray } from '@reactivex/ix-es2015-cjs/asynciterable/toarray';
import { data, factory, keys } from '../../__data__';
import { convertAction, JSONRPCClient, JSONRPCHTTPProvider, NEOONEDataProvider } from '../../provider';

jest.mock('../../provider/JSONRPCClient');

describe('NEOONEDataProvider', () => {
  const network = 'local';
  const rpcURL = 'https://neotracker.io/rpc';

  let client: Modifiable<JSONRPCClient>;
  let provider: NEOONEDataProvider;
  beforeEach(() => {
    provider = new NEOONEDataProvider({ network, rpcURL });
    // tslint:disable-next-line no-any
    client = (provider as any).mutableClient;
  });

  const verifyInvocationResultSuccess = (
    invocationResult: RawInvocationResult,
    invocationResultJSON: InvocationResultJSON,
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

  const verifyContractParameterType = (param: ContractParameterType, paramJSON: ContractParameterTypeJSON) => {
    switch (paramJSON) {
      case 'Signature':
        expect(param).toEqual('Signature');
        break;
      case 'Boolean':
        expect(param).toEqual('Boolean');
        break;
      case 'Integer':
        expect(param).toEqual('Integer');
        break;
      case 'Hash160':
        expect(param).toEqual('Address');
        break;
      case 'Hash256':
        expect(param).toEqual('Hash256');
        break;
      case 'ByteArray':
        expect(param).toEqual('Buffer');
        break;
      case 'PublicKey':
        expect(param).toEqual('PublicKey');
        break;
      case 'String':
        expect(param).toEqual('String');
        break;
      case 'Array':
        expect(param).toEqual('Array');
        break;
      case 'Map':
        expect(param).toEqual('Map');
        break;
      case 'InteropInterface':
        expect(param).toEqual('InteropInterface');
        break;
      case 'Void':
        expect(param).toEqual('Void');
        break;
      /* istanbul ignore next */
      default:
        commonUtils.assertNever(paramJSON);
        throw new Error('For TS');
    }
  };

  const verifyContractParameterDeclaration = (
    param: ContractParameterDeclaration,
    paramJSON: ContractParameterDeclarationJSON,
  ) => {
    expect(param.name).toEqual(paramJSON.name);
    verifyContractParameterType(param.type, paramJSON.type);
  };

  const verifyContractEvent = (event: ContractEvent, eventJSON: ContractEventJSON) => {
    expect(event.name).toEqual(eventJSON.name);
    event.parameters.forEach((param, idx) => verifyContractParameterDeclaration(param, eventJSON.parameters[idx]));
  };

  const verifyContractMethodDescriptor = (
    method: ContractMethodDescriptor,
    methodJSON: ContractMethodDescriptorJSON,
  ) => {
    expect(method.name).toEqual(methodJSON.name);
    method.parameters.forEach((param, idx) => verifyContractParameterDeclaration(param, methodJSON.parameters[idx]));
    verifyContractParameterType(method.returnType, methodJSON.returnType);
  };

  const verifyContractAbi = (abi: ContractAbi, abiJSON: ContractAbiJSON) => {
    expect(abi.hash).toEqual(common.hexToUInt160(abiJSON.hash));
    verifyContractMethodDescriptor(abi.entryPoint, abiJSON.entryPoint);
    abi.methods.forEach((method, idx) => verifyContractMethodDescriptor(method, abiJSON.methods[idx]));
    abi.events.forEach((event, idx) => verifyContractEvent(event, abiJSON.events[idx]));
  };

  const verifyContractGroup = (group: ContractGroup, groupJSON: ContractGroupJSON) => {
    expect(group.publicKey).toEqual(common.hexToECPoint(groupJSON.publicKey));
    expect(group.signature).toEqual(groupJSON.signature);
  };

  const verifyContractPermissionDescriptor = (
    permissionDescriptor: ContractPermissionDescriptor,
    permissionDescriptorJSON: ContractPermissionDescriptorJSON,
  ) => {
    let checked = false;
    let permissionConverted;

    if (permissionDescriptorJSON === '*') {
      checked = true;
    }

    try {
      permissionConverted = common.hexToUInt160(permissionDescriptorJSON);
      checked = true;
    } catch {
      // do nothing
    }

    try {
      permissionConverted = common.hexToECPoint(permissionDescriptorJSON);
      checked = true;
    } catch {
      // do nothing
    }

    if (checked) {
      expect(permissionDescriptor.hashOrGroup).toEqual(permissionConverted);
    } else {
      throw new Error('Invalid ContractPermissionDescriptorJSON');
    }
  };

  const verifyWildcardContainer = <T, U>(
    wildcard: WildcardContainer<T>,
    wildcardJSON: WildcardContainerJSON<U>,
    checkFunction: (t: T, u: U) => void,
  ) => {
    if (wildcard.data === undefined) {
      expect(wildcardJSON).toEqual('*');
    } else {
      wildcard.data.forEach((val, idx) => checkFunction(val, (wildcardJSON as readonly U[])[idx]));
    }
  };

  const verifyContractPermissions = (permission: ContractPermissions, permissionJSON: ContractPermissionsJSON) => {
    verifyContractPermissionDescriptor(permission.contract, permissionJSON.contract);
    verifyWildcardContainer<string, string>(permission.methods, permissionJSON.methods, (method, methodJSON) =>
      expect(method).toEqual(methodJSON),
    );
  };

  const verifyContractManifest = (manifest: ContractManifest, manifestJSON: ContractManifestJSON) => {
    verifyContractAbi(manifest.abi, manifestJSON.abi);
    manifest.groups.forEach((group, idx) => verifyContractGroup(group, manifestJSON.groups[idx]));
    manifest.permissions.forEach((permission, idx) =>
      verifyContractPermissions(permission, manifestJSON.permissions[idx]),
    );
    verifyWildcardContainer(manifest.trusts, manifestJSON.trusts, (trust, trustJSON) =>
      expect(trust).toEqual(common.hexToUInt160(trustJSON)),
    );
    verifyWildcardContainer(manifest.safeMethods, manifestJSON.safeMethods, (method, methodJSON) =>
      expect(method).toEqual(methodJSON),
    );
    expect(manifest.features).toEqual(manifestJSON.features);
  };

  const verifyContract = (contract: Contract, contractJSON: ContractJSON) => {
    expect(contract.address).toEqual(scriptHashToAddress(contractJSON.hash));
    expect(contract.script).toEqual(contractJSON.script);
    verifyContractManifest(contract.manifest, contractJSON.manifest);
  };

  const verifyCosigners = (cosigner: Cosigner, cosignerJSON: CosignerJSON) => {
    expect(cosigner.account).toEqual(cosignerJSON.account);
    expect(cosigner.scopes).toEqual(cosignerJSON.scopes);
    expect(cosigner.allowedContracts).toEqual(cosignerJSON.allowedContracts);
    if (cosigner.allowedGroups === undefined) {
      expect(cosignerJSON.allowedContracts).toEqual(undefined);
    } else {
      cosigner.allowedGroups.forEach((group, idx) => {
        expect(common.hexToECPoint(group)).toEqual((cosignerJSON.allowedGroups as readonly string[])[idx]);
      });
    }
  };

  const verifyTransaction = (transaction: Transaction, transactionJSON: TransactionJSON) => {
    expect(transaction.hash).toEqual(transactionJSON.hash);
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
    expect(transaction.nonce).toEqual(transactionJSON.nonce);
    expect(transaction.sender).toEqual(transactionJSON.sender);
    expect(transaction.systemFee.toString(10)).toEqual(transactionJSON.sys_fee);
    expect(transaction.networkFee.toString(10)).toEqual(transactionJSON.net_fee);
    expect(transaction.validUntilBlock).toEqual(transactionJSON.valid_until_block);
    expect(transaction.witnesses).toEqual(transactionJSON.witnesses);
    transaction.cosigners.forEach((cosigner, idx) => verifyCosigners(cosigner, transactionJSON.cosigners[idx]));
  };

  const verifyConfirmedTransaction = (transaction: ConfirmedTransaction, transactionJSON: ConfirmedTransactionJSON) => {
    verifyTransaction(transaction, transactionJSON);

    expect(transaction.blockHash).toEqual(transactionJSON.blockHash);
    expect(transaction.blockTime).toEqual(transactionJSON.blockTime);
    expect(transaction.transactionHash).toEqual(transactionJSON.transactionHash);
    expect(transaction.confirmations).toEqual(transactionJSON.confirmations);
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

  test('setRPCURL', () => {
    const currentClient = client;

    provider.setRPCURL('http://localhost:1340');

    // tslint:disable-next-line no-any
    expect(currentClient).not.toBe((provider as any).mutableClient);
  });

  test('sendTransaction', async () => {
    const transactionJSON = factory.createTransactionJSON();
    client.sendTransaction = jest.fn(async () =>
      Promise.resolve({
        transaction: transactionJSON,
      }),
    );

    const result = await provider.sendTransaction(data.serializedTransaction.valid);

    verifyTransaction(result.transaction, transactionJSON);
  });

  test('verifyConvertTransaction', async () => {
    const transactionJSON = factory.createTransactionJSON();

    const actionJSON = factory.createLogActionJSON();
    const verificationScriptJSON = factory.createVerifyScriptResultJSON({
      failureMessage: 'test',
      actions: [actionJSON],
    });
    const verifyResultJSON = factory.createVerifyTransactionResultJSON({
      verifications: [verificationScriptJSON],
    });

    client.sendTransaction = jest.fn(async () =>
      Promise.resolve({
        transaction: transactionJSON,
        verifyResult: verifyResultJSON,
      }),
    );

    const result = await provider.sendTransaction(data.serializedTransaction.valid);

    if (result.verifyResult === undefined) {
      throw new Error('for TS');
    }

    expect(result.verifyResult.verifications).toEqual([
      {
        failureMessage: 'test',
        witness: verificationScriptJSON.witness,
        address: scriptHashToAddress(verificationScriptJSON.hash),
        actions: [
          convertAction(common.uInt256ToString(common.ZERO_UINT256), -1, transactionJSON.hash, -1, 0, actionJSON),
        ],
      },
    ]);
  });

  test('getTransaction', async () => {
    const confirmedTransaction = factory.createConfirmedTransactionJSON();
    // tslint:disable-next-line:no-any
    client.getTransaction = jest.fn(async () => Promise.resolve(confirmedTransaction) as any);

    const result = await provider.getTransaction(data.hash256s.a);

    verifyConfirmedTransaction(result, confirmedTransaction);
  });

  test('invokeRawScript', async () => {
    const callReceiptJSON = factory.createInvocationResultSuccessJSON();
    client.invokeScript = jest.fn(async () => Promise.resolve(callReceiptJSON));

    const result = await provider.invokeRawScript(data.serializedTransaction.valid);

    verifyInvocationResultSuccess(result, callReceiptJSON);
  });

  test('invokeFunction', async () => {
    const callReceiptJSON = factory.createInvocationResultSuccessJSON();
    client.invokeFunction = jest.fn(async () => Promise.resolve(callReceiptJSON));

    const result = await provider.invokeFunction(keys[0].address, 'foo', []);

    verifyInvocationResultSuccess(result, callReceiptJSON);
  });

  test('getBlock', async () => {
    const blockJSON = factory.createBlockJSON();
    client.getBlock = jest.fn(async () => Promise.resolve(blockJSON));

    const result = await provider.getBlock(10);

    expect(result.version).toEqual(blockJSON.version);
    expect(result.hash).toEqual(blockJSON.hash);
    expect(result.size).toEqual(blockJSON.size);
    expect(result.previousBlockHash).toEqual(blockJSON.previousblockhash);
    expect(result.merkleRoot).toEqual(blockJSON.merkleroot);
    expect(result.time.toString()).toEqual(blockJSON.time);
    expect(result.index).toEqual(blockJSON.index);
    expect(result.nextConsensus).toEqual(blockJSON.nextconsensus);
    expect(result.witnesses[0].invocation).toEqual(blockJSON.witnesses[0].invocation);
    expect(result.witnesses[0].verification).toEqual(blockJSON.witnesses[0].verification);
    expect(result.confirmations).toEqual(blockJSON.confirmations);
    expect(result.nextBlockHash).toEqual(blockJSON.nextblockhash);
    expect(result.transactions.length).toEqual(blockJSON.tx.length);
    verifyConfirmedTransaction(result.transactions[0], blockJSON.tx[0]);
    expect(result.consensusData.nonce).toEqual(blockJSON.consensus_data.nonce);
    expect(result.consensusData.primaryIndex).toEqual(blockJSON.consensus_data.primary);
  });

  test('iterBlocks', async () => {
    const blockJSON = factory.createBlockJSON();
    client.getBlockCount = jest.fn(async () => Promise.resolve(2));
    client.getBlock = jest.fn(async () => Promise.resolve(blockJSON));

    const result = await toArray(provider.iterBlocks({ indexStart: 1, indexStop: 2 }));

    expect(result.length).toEqual(1);
  });

  test('getBestBlockHash', async () => {
    const hash = data.hash256s.a;
    client.getBestBlockHash = jest.fn(async () => Promise.resolve(hash));

    const result = await provider.getBestBlockHash();

    expect(result).toEqual(hash);
  });

  test('getBlockCount', async () => {
    const count = 2;
    client.getBlockCount = jest.fn(async () => Promise.resolve(count));

    const result = await provider.getBlockCount();

    expect(result).toEqual(count);
  });

  test('getContract', async () => {
    const contractJSON = factory.createContractJSON();
    client.getContract = jest.fn(async () => Promise.resolve(contractJSON));

    const result = await provider.getContract(keys[0].address);

    verifyContract(result, contractJSON);
  });

  const convertedContractParameterTypes = [
    ['Signature', 'Signature'] as const,
    ['Boolean', 'Boolean'] as const,
    ['Integer', 'Integer'] as const,
    ['Hash160', 'Address'] as const,
    ['Hash256', 'Hash256'] as const,
    ['ByteArray', 'Buffer'] as const,
    ['PublicKey', 'PublicKey'] as const,
    ['String', 'String'] as const,
    ['Array', 'Array'] as const,
    ['InteropInterface', 'InteropInterface'] as const,
    ['Void', 'Void'] as const,
  ];

  convertedContractParameterTypes.forEach(([from, to]) => {
    test(`getContract - ${from} -> ${to}`, async () => {
      const methodJSON = factory.createContractMethodDescriptorJSON({ returnType: from });
      const contractAbiJSON = factory.createContractAbiJSON({ methods: [methodJSON] });
      const contractManifestJSON = factory.createContractManifestJSON({ abi: contractAbiJSON });
      const contractJSON = factory.createContractJSON({ manifest: contractManifestJSON });
      client.getContract = jest.fn(async () => Promise.resolve(contractJSON));

      const result = await provider.getContract(keys[0].address);
      verifyContract(result, contractJSON);
    });
  });

  test('getMemPool', async () => {
    const memPool = [data.hash256s.a];
    client.getMemPool = jest.fn(async () => Promise.resolve(memPool));

    const result = await provider.getMemPool();

    expect(result).toEqual(memPool);
  });

  test('getConnectedPeers', async () => {
    const peersJSON = [factory.createPeerJSON()];
    client.getConnectedPeers = jest.fn(async () => Promise.resolve(peersJSON));

    const result = await provider.getConnectedPeers();

    expect(result).toEqual(peersJSON);
  });

  const verifyStorage = (item: StorageItem, itemJSON: StorageItemJSON) => {
    expect(item.address).toEqual(keys[0].address);
    expect(item.key).toEqual(data.buffers.a);
    expect(item.value).toEqual(itemJSON.value);
  };

  // test('iterStorage', async () => {
  //   const storageItemJSON = factory.createStorageItemJSON();
  //   client.getAllStorage = jest.fn(async () => Promise.resolve([storageItemJSON]));

  //   const result = await toArray(provider.iterStorage(keys[0].address));

  //   expect(result).toHaveLength(1);
  //   verifyStorage(result[0], storageItemJSON);
  // });

  // test('iterActionsRaw', async () => {
  //   const blockJSON = factory.createBlockJSON();
  //   client.getBlockCount = jest.fn(async () => Promise.resolve(2));
  //   client.getBlock = jest.fn(async () => Promise.resolve(blockJSON));

  //   const result = await toArray(provider.iterActionsRaw({ indexStart: 1, indexStop: 2 }));

  //   expect(result.length).toEqual(2);
  //   const transactionJSON = blockJSON.tx[4];
  //   if (
  //     transactionJSON.type !== 'InvocationTransaction' ||
  //     transactionJSON.data === undefined ||
  //     transactionJSON.invocationData === undefined
  //   ) {
  //     throw new Error('For TS');
  //   }

  //   verifyDefaultActions(
  //     result,
  //     transactionJSON.invocationData.actions,
  //     transactionJSON.data.blockIndex,
  //     transactionJSON.data.blockHash,
  //     transactionJSON.data.transactionIndex,
  //     transactionJSON.txid,
  //   );
  // });

  // test('runConsensusNow', async () => {
  //   const runConsensusNow = jest.fn(async () => Promise.resolve());
  //   client.runConsensusNow = runConsensusNow;

  //   await provider.runConsensusNow();

  //   expect(runConsensusNow).toHaveBeenCalled();
  // });

  // test('updateSettings', async () => {
  //   const updateSettings = jest.fn(async () => Promise.resolve());
  //   client.updateSettings = updateSettings;
  //   const options = { secondsPerBlock: 10 };

  //   await provider.updateSettings(options);

  //   expect(updateSettings).toHaveBeenCalledWith(options);
  // });

  // test('fastForwardOffset', async () => {
  //   const fastForwardOffset = jest.fn(async () => Promise.resolve());
  //   client.fastForwardOffset = fastForwardOffset;
  //   const options = 10;

  //   await provider.fastForwardOffset(options);

  //   expect(fastForwardOffset).toHaveBeenCalledWith(options);
  // });

  // test('fastForwardToTime', async () => {
  //   const fastForwardToTime = jest.fn(async () => Promise.resolve());
  //   client.fastForwardToTime = fastForwardToTime;
  //   const options = 10;

  //   await provider.fastForwardToTime(options);

  //   expect(fastForwardToTime).toHaveBeenCalledWith(options);
  // });

  // test('reset', async () => {
  //   const reset = jest.fn(async () => Promise.resolve());
  //   client.reset = reset;

  //   await provider.reset();

  //   expect(reset).toHaveBeenCalled();
  // });

  test('convertMapContractParamaterType - Map', async () => {
    const methodJSON = factory.createContractMethodDescriptorJSON({
      parameters: [factory.contractParamDeclarationJSON.map],
    });
    const contractAbiJSON = factory.createContractAbiJSON({ methods: [methodJSON] });
    const contractManifestJSON = factory.createContractManifestJSON({ abi: contractAbiJSON });
    const contractJSON = factory.createContractJSON({ manifest: contractManifestJSON });
    client.getContract = jest.fn(async () => Promise.resolve(contractJSON));

    const result = await provider.getContract(keys[0].address);

    verifyContract(result, contractJSON);
  });

  test('construction with rpcURL provider works', () => {
    provider = new NEOONEDataProvider({ network, rpcURL: new JSONRPCHTTPProvider(rpcURL) });
    expect(provider).toBeDefined();
  });
});
