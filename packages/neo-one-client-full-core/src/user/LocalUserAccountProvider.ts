import {
  ABIParameter,
  ABIReturn,
  BufferString,
  Contract,
  ContractManifestClient,
  ContractParameterTypeModel,
  crypto,
  NetworkSettings,
  NetworkType,
  Param,
  RawInvocationData,
  RawInvokeReceipt,
  RawTransactionResultError,
  RawTransactionResultSuccess,
  ScriptBuilder,
  SourceMaps,
  TransactionOptions,
  TransactionResult,
  TransactionResultError,
  TransactionResultSuccess,
  UserAccountID,
} from '@neo-one/client-common';
import {
  convertParams,
  InvalidTransactionError,
  KeyStore,
  LocalUserAccountProvider as LocalUserAccountProviderLite,
  Provider as ProviderLite,
} from '@neo-one/client-core';
import {
  ContractABIModel,
  ContractEventDescriptorModel,
  ContractGroupModel,
  ContractManifestModel,
  ContractMethodDescriptorModel,
  ContractParameterDefinitionModel,
  ContractPermissionDescriptorModel,
  ContractPermissionModel,
  ContractStateModel,
  getContractProperties,
} from '@neo-one/client-full-common';
import { processActionsAndMessage, processConsoleLogMessages } from '@neo-one/client-switch';
import { utils as commonUtils } from '@neo-one/utils';
import {
  ContractRegister,
  DataProvider,
  InvokeExecuteTransactionOptions,
  PublishReceipt,
  UserAccountProvider,
} from '../types';

const toContractParameterType = (parameter: ABIReturn | ABIParameter): ContractParameterTypeModel => {
  switch (parameter.type) {
    case 'Any':
      return ContractParameterTypeModel.Any;
    case 'Signature':
      return ContractParameterTypeModel.Signature;
    case 'Boolean':
      return ContractParameterTypeModel.Boolean;
    case 'Integer':
      return ContractParameterTypeModel.Integer;
    case 'Hash160':
      return ContractParameterTypeModel.Hash160;
    case 'Hash256':
      return ContractParameterTypeModel.Hash256;
    case 'Buffer':
      return ContractParameterTypeModel.ByteArray;
    case 'PublicKey':
      return ContractParameterTypeModel.PublicKey;
    case 'String':
      return ContractParameterTypeModel.String;
    case 'Array':
      return ContractParameterTypeModel.Array;
    case 'Object': // TODO: is this correct?
    case 'Map':
      return ContractParameterTypeModel.Map;
    case 'ForwardValue': // TODO: is this correct?
      return ContractParameterTypeModel.InteropInterface;
    case 'Void':
      return ContractParameterTypeModel.Void;
    default:
      /* istanbul ignore next */
      commonUtils.assertNever(parameter);
      /* istanbul ignore next */
      throw new Error('For TS');
  }
};

const contractRegisterToContractModel = (contractIn: ContractRegister): ContractStateModel => {
  const abi = new ContractABIModel({
    hash: contractIn.manifest.abi.hash,
    methods: contractIn.manifest.abi.methods.map(
      (methodIn) =>
        new ContractMethodDescriptorModel({
          returnType: toContractParameterType(methodIn.returnType),
          offset: methodIn.offset,
          name: methodIn.name,
          parameters:
            methodIn.parameters === undefined
              ? []
              : methodIn.parameters.map(
                  (param) =>
                    new ContractParameterDefinitionModel({
                      type: toContractParameterType(param),
                      name: param.name,
                    }),
                ),
        }),
    ),
    events: contractIn.manifest.abi.events.map(
      (event) =>
        new ContractEventDescriptorModel({
          name: event.name,
          parameters: event.parameters.map(
            (param) => new ContractParameterDefinitionModel({ type: toContractParameterType(param), name: param.name }),
          ),
        }),
    ),
  });
  const manifest = new ContractManifestModel({
    groups: contractIn.manifest.groups.map(
      (group) => new ContractGroupModel({ publicKey: group.publicKey, signature: Buffer.from(group.signature, 'hex') }),
    ),
    features: getContractProperties({
      hasStorage: contractIn.manifest.features.storage,
      payable: contractIn.manifest.features.payable,
    }),
    supportedStandards: contractIn.manifest.supportedStandards,
    abi,
    permissions: contractIn.manifest.permissions.map(
      (perm) =>
        new ContractPermissionModel({
          contract: new ContractPermissionDescriptorModel(perm.contract),
          methods: perm.methods,
        }),
    ),
    trusts: contractIn.manifest.trusts,
    safeMethods: contractIn.manifest.safeMethods,
    extra: contractIn.manifest.extra,
  });

  return new ContractStateModel({
    script: Buffer.from(contractIn.script, 'hex'),
    id: contractIn.id,
    manifest,
  });
};

export interface Provider extends ProviderLite {
  readonly getNetworkSettings: (network: NetworkType) => Promise<NetworkSettings>;
  readonly read: (network: NetworkType) => DataProvider;
}

export class LocalUserAccountProvider<TKeyStore extends KeyStore, TProvider extends Provider>
  extends LocalUserAccountProviderLite<TKeyStore, TProvider>
  implements UserAccountProvider {
  public read(network: NetworkType): DataProvider {
    return this.provider.read(network);
  }

  public async publish(
    contract: ContractRegister,
    options?: TransactionOptions,
  ): Promise<TransactionResult<PublishReceipt>> {
    return this.publishBase(
      'publish',
      contract,
      () => {
        // do nothing,
      },
      undefined,
      options,
    );
  }

  public async publishAndDeploy(
    contract: ContractRegister,
    manifest: ContractManifestClient,
    params: readonly Param[],
    options?: TransactionOptions,
    sourceMaps: SourceMaps = {},
  ): Promise<TransactionResult<PublishReceipt>> {
    return this.publishBase(
      'publish',
      contract,
      (sb, from) => {
        const deployFunc = manifest.abi.methods.find((func) => func.name === 'deploy');
        if (deployFunc !== undefined) {
          // []
          sb.emitOp('DROP');
          const hash = crypto.toScriptHash(Buffer.from(contract.script, 'hex'));
          sb.emitAppCall(
            hash,
            'deploy',
            ...convertParams({
              parameters: deployFunc.parameters === undefined ? [] : deployFunc.parameters,
              params,
              senderAddress: from.address,
            }).converted,
          );
          sb.emitOp('ASSERT');
        }
      },
      sourceMaps,
      options,
    );
  }

  public async __execute(
    script: BufferString,
    options: InvokeExecuteTransactionOptions = {},
    sourceMaps: SourceMaps = {},
  ): Promise<TransactionResult<RawInvokeReceipt>> {
    const { from } = this.getTransactionOptions(options);

    return this.invokeRaw({
      invokeMethodOptionsOrScript: Buffer.from(script, 'hex'),
      options,
      transfers: options.transfers === undefined ? [] : options.transfers.map((transfer) => ({ ...transfer, from })),
      onConfirm: ({ receipt, data }): RawInvokeReceipt => ({
        blockIndex: receipt.blockIndex,
        blockHash: receipt.blockHash,
        blockTime: receipt.blockTime,
        transactionIndex: receipt.transactionIndex,
        transactionHash: receipt.transactionHash,
        globalIndex: receipt.globalIndex,
        confirmations: receipt.confirmations,
        result: data.result,
        actions: data.actions,
      }),
      method: 'execute',
      sourceMaps,
    });
  }

  protected async publishBase(
    method: string,
    contractIn: ContractRegister,
    emit: (sb: ScriptBuilder, from: UserAccountID) => void,
    sourceMaps: SourceMaps = {},
    options?: TransactionOptions,
  ): Promise<TransactionResult<PublishReceipt>> {
    const contract = contractRegisterToContractModel(contractIn);

    const sb = new ScriptBuilder();
    sb.emitSysCall('System.Contract.Create', contract.script, contract.manifest.serializeWire());
    const { from } = this.getTransactionOptions(options);
    emit(sb, from);

    return this.invokeRaw({
      invokeMethodOptionsOrScript: sb.build(),
      options,
      onConfirm: async ({ receipt, data }): Promise<PublishReceipt> => {
        let result;
        if (data.result.state === 'FAULT') {
          result = await this.getInvocationResultError(data, data.result, sourceMaps);
        } else {
          const createdContract = data.contracts[0] as Contract | undefined;
          if (createdContract === undefined) {
            /* istanbul ignore next */
            throw new InvalidTransactionError(
              'Something went wrong! Expected a contract to have been created, but none was found',
            );
          }

          result = await this.getInvocationResultSuccess(data, data.result, createdContract, sourceMaps);
        }

        return {
          blockIndex: receipt.blockIndex,
          blockHash: receipt.blockHash,
          transactionIndex: receipt.transactionIndex,
          globalIndex: receipt.globalIndex,
          blockTime: receipt.blockTime,
          transactionHash: receipt.transactionHash,
          confirmations: receipt.confirmations,
          result,
        };
      },
      sourceMaps,
      method,
    });
  }

  protected async getInvocationResultError(
    data: RawInvocationData,
    result: RawTransactionResultError,
    sourceMaps: SourceMaps = {},
  ): Promise<TransactionResultError> {
    const message = await processActionsAndMessage({
      actions: data.actions,
      message: result.message,
      sourceMaps,
    });

    return {
      state: result.state,
      gasConsumed: result.gasConsumed,
      gasCost: result.gasCost,
      script: result.script,
      message,
    };
  }

  protected async getInvocationResultSuccess<T>(
    data: RawInvocationData,
    result: RawTransactionResultSuccess,
    value: T,
    sourceMaps: SourceMaps = {},
  ): Promise<TransactionResultSuccess<T>> {
    await processConsoleLogMessages({
      actions: data.actions,
      sourceMaps,
    });

    return {
      state: result.state,
      gasConsumed: result.gasConsumed,
      gasCost: result.gasCost,
      script: result.script,
      value,
    };
  }
}
