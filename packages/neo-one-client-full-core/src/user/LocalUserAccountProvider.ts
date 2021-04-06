import {
  ABIParameter,
  ABIReturn,
  BinaryWriter,
  BufferString,
  CallFlags,
  common,
  ContractManifestClient,
  ContractParameterTypeModel,
  ContractPermissionDescriptor,
  crypto,
  ECPoint,
  InvocationResultError,
  InvocationResultSuccess,
  NetworkSettings,
  NetworkType,
  Param,
  RawApplicationLogData,
  RawInvokeReceipt,
  ScriptBuilder,
  scriptHashToAddress,
  SignerModel,
  SourceMaps,
  TransactionOptions,
  TransactionResult,
  UInt160,
  UserAccountID,
  utils as clientUtils,
  Wildcard,
  WitnessScopeModel,
} from '@neo-one/client-common';
import {
  convertParams,
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
    case 'Address':
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

export const contractRegisterToContractModel = (
  contractIn: ContractRegister,
  contractHash: UInt160,
): ContractStateModel => {
  const abi = new ContractABIModel({
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
          safe: methodIn.safe ?? false,
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
  const getPermission = ({ hash, group }: ContractPermissionDescriptor): UInt160 | ECPoint | Wildcard => {
    if (hash !== undefined && group !== undefined) {
      throw new Error('Hash and group should not both be defined.');
    }

    if (hash !== undefined) {
      if (!common.isUInt160(hash)) {
        throw new Error('Invalid UInt160');
      }

      return common.stringToUInt160(hash);
    }

    if (group !== undefined) {
      if (!common.isECPoint(group)) {
        throw new Error('Invalid ECPoint');
      }

      return common.stringToECPoint(group);
    }

    return '*';
  };
  const manifest = new ContractManifestModel({
    name: contractIn.manifest.name,
    groups: contractIn.manifest.groups.map(
      (group) =>
        new ContractGroupModel({
          publicKey: common.stringToECPoint(group.publicKey),
          signature: Buffer.from(group.signature, 'hex'),
        }),
    ),
    supportedStandards: contractIn.manifest.supportedStandards,
    abi,
    permissions: contractIn.manifest.permissions.map(
      (perm) =>
        new ContractPermissionModel({
          contract: new ContractPermissionDescriptorModel({ hashOrGroup: getPermission(perm.contract) }),
          methods: perm.methods,
        }),
    ),
    trusts: contractIn.manifest.trusts === '*' ? '*' : contractIn.manifest.trusts.map(common.stringToUInt160),
    extra: contractIn.manifest.extra,
  });

  return new ContractStateModel({
    hash: contractHash,
    updateCounter: 1, // TODO: what should this be?
    script: Buffer.from(contractIn.script, 'hex'),
    id: clientUtils.randomUShort(),
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
      (sb, from, hash) => {
        const deployFunc = manifest.abi.methods.find((func) => func.name === 'deploy');
        if (deployFunc !== undefined) {
          // []
          sb.emitOp('DROP');
          sb.emitDynamicAppCall(
            hash,
            'deploy',
            CallFlags.All,
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
    const bufferScript = Buffer.from(script, 'hex');

    return this.invokeRaw({
      invokeMethodOptionsOrScript: bufferScript,
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
        stack: typeof data.stack === 'string' ? [] : data.stack, // TODO: fix
        state: data.vmState as 'HALT' | 'FAULT', // TODO: fix
        script: bufferScript,
        gasConsumed: data.gasConsumed,
        logs: data.logs,
        notifications: data.notifications,
      }),
      method: 'execute',
      sourceMaps,
    });
  }

  protected async publishBase(
    method: string,
    contractIn: ContractRegister,
    emit: (sb: ScriptBuilder, from: UserAccountID, hash: UInt160) => void,
    sourceMaps: SourceMaps = {},
    options?: TransactionOptions,
  ): Promise<TransactionResult<PublishReceipt>> {
    const address = this.getCurrentUserAccount()?.id.address;
    if (address === undefined) {
      throw new Error('Expected address to be defined');
    }
    // TODO: clean up this mess and clean up this transaction flow
    const signer = new SignerModel({
      account: crypto.addressToScriptHash({ address, addressVersion: common.NEO_ADDRESS_VERSION }),
      scopes: WitnessScopeModel.Global,
    });

    const contractHashUInt160 = crypto.getContractHash(signer.account, Buffer.from(contractIn.script, 'hex'));
    const contractHash = common.uInt160ToString(contractHashUInt160);
    const contract = contractRegisterToContractModel(contractIn, contractHashUInt160);

    // TODO: create function to do this
    const writer = new BinaryWriter();
    writer.writeUInt32LE(0x3346454e); // TODO: abstract this number
    writer.writeFixedString(contractIn.compilerName, 64);
    writer.writeUInt16LE(0);
    // writer.writeArray(contractIn.manifest.abi.methods);
    writer.writeUInt16LE(0);
    writer.writeVarBytesLE(Buffer.from(contractIn.script, 'hex'));
    writer.writeBytes(crypto.sha256(crypto.sha256(writer.toBuffer())).slice(0, 4));

    const sb = new ScriptBuilder();
    sb.emitPush(contract.manifest.serializeWireForNeo()); // TODO: remove this later
    sb.emitPush(writer.toBuffer());
    sb.emitPushInt(2);
    sb.emitOp('PACK');
    sb.emitPushString('deploy');
    sb.emitPush(common.nativeHashes.ContractManagement);
    sb.emitSysCall('System.Contract.Call');
    const { from } = this.getTransactionOptions(options);
    emit(sb, from, contractHashUInt160);

    const script = sb.build();

    return this.invokeRaw({
      invokeMethodOptionsOrScript: script,
      options,
      onConfirm: async ({ receipt, data }): Promise<PublishReceipt> => {
        let result;
        // tslint:disable-next-line: prefer-switch
        if (data.vmState === 'FAULT') {
          result = await this.getInvocationResultError(data, sourceMaps);
        } else if (data.vmState === 'NONE' || data.vmState === 'BREAK') {
          throw new Error(`Something went wrong. Expected VM state HALT or FAULT. Got: ${data.vmState}`);
        } else {
          const contractAddress = scriptHashToAddress(contractHash);
          const contractOut = await this.provider.getContract(from.network, contractAddress);

          result = await this.getInvocationResultSuccess(data, contractOut, sourceMaps);
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
    data: RawApplicationLogData,
    sourceMaps: SourceMaps = {},
  ): Promise<InvocationResultError> {
    const message = await processActionsAndMessage({
      actions: [...data.logs, ...data.notifications],
      sourceMaps,
    });

    // TODO: fix vm states
    // tslint:disable-next-line: prefer-switch
    if (data.vmState === 'HALT' || data.vmState === 'BREAK' || data.vmState === 'NONE') {
      throw new Error(`Expected FAULT state. Got: ${data.vmState}`);
    }

    return {
      state: data.vmState,
      gasConsumed: data.gasConsumed,
      message,
    };
  }

  protected async getInvocationResultSuccess<T>(
    data: RawApplicationLogData,
    value: T,
    sourceMaps: SourceMaps = {},
  ): Promise<InvocationResultSuccess<T>> {
    await processConsoleLogMessages({
      actions: [...data.logs, ...data.notifications],
      sourceMaps,
    });

    // TODO: fix vm states
    // tslint:disable-next-line: prefer-switch
    if (data.vmState === 'FAULT' || data.vmState === 'BREAK' || data.vmState === 'NONE') {
      throw new Error(`Expected HALT state. Got: ${data.vmState}`);
    }

    return {
      state: data.vmState,
      gasConsumed: data.gasConsumed,
      value,
    };
  }
}
