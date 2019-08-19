import {
  ABI,
  addressToScriptHash,
  AssetType,
  AssetTypeModel,
  BufferString,
  common,
  Contract,
  ContractParameterType,
  ContractParameterTypeModel,
  crypto,
  InvocationResultError,
  InvocationResultSuccess,
  InvocationTransaction,
  IssueTransaction,
  NetworkSettings,
  NetworkType,
  Param,
  RawInvocationData,
  RawInvocationResultError,
  RawInvocationResultSuccess,
  RawInvokeReceipt,
  ScriptBuilder,
  SourceMaps,
  TransactionOptions,
  TransactionReceipt,
  TransactionResult,
  Transfer,
  UserAccountID,
  utils,
} from '@neo-one/client-common';
import {
  convertParams,
  InvalidTransactionError,
  KeyStore,
  LocalUserAccountProvider as LocalUserAccountProviderLite,
  Provider as ProviderLite,
} from '@neo-one/client-core';
import { ContractModel, getContractProperties, IssueTransactionModel } from '@neo-one/client-full-common';
import { processActionsAndMessage, processConsoleLogMessages } from '@neo-one/client-switch';
import { utils as commonUtils } from '@neo-one/utils';
import { NothingToIssueError } from '../errors';
import {
  AssetRegister,
  ContractRegister,
  DataProvider,
  InvokeExecuteTransactionOptions,
  PublishReceipt,
  RegisterAssetReceipt,
  UserAccountProvider,
} from '../types';

const toContractParameterType = (parameter: ContractParameterType): ContractParameterTypeModel => {
  switch (parameter) {
    case 'Signature':
      return ContractParameterTypeModel.Signature;
    case 'Boolean':
      return ContractParameterTypeModel.Boolean;
    case 'Integer':
      return ContractParameterTypeModel.Integer;
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
    case 'Map':
      return ContractParameterTypeModel.Map;
    case 'InteropInterface':
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

const toAssetType = (assetType: AssetType): AssetTypeModel => {
  switch (assetType) {
    case 'Credit':
      return AssetTypeModel.CreditFlag;
    case 'Duty':
      return AssetTypeModel.DutyFlag;
    case 'Governing':
      return AssetTypeModel.GoverningToken;
    case 'Utility':
      return AssetTypeModel.UtilityToken;
    case 'Currency':
      return AssetTypeModel.Currency;
    case 'Share':
      return AssetTypeModel.Share;
    case 'Invoice':
      return AssetTypeModel.Invoice;
    case 'Token':
      return AssetTypeModel.Token;
    default:
      /* istanbul ignore next */
      commonUtils.assertNever(assetType);
      /* istanbul ignore next */
      throw new Error('For TS');
  }
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
  ): Promise<TransactionResult<PublishReceipt, InvocationTransaction>> {
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
    abi: ABI,
    params: readonly Param[],
    options?: TransactionOptions,
    sourceMaps: SourceMaps = {},
  ): Promise<TransactionResult<PublishReceipt, InvocationTransaction>> {
    return this.publishBase(
      'publish',
      contract,
      (sb, from) => {
        const deployFunc = abi.functions.find((func) => func.name === 'deploy');
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
          sb.emitOp('THROWIFNOT');
        }
      },
      sourceMaps,
      options,
    );
  }

  public async registerAsset(
    asset: AssetRegister,
    options?: TransactionOptions,
  ): Promise<TransactionResult<RegisterAssetReceipt, InvocationTransaction>> {
    const sb = new ScriptBuilder();

    sb.emitSysCall(
      'Neo.Asset.Create',
      toAssetType(asset.type),
      asset.name,
      utils.bigNumberToBN(asset.amount, 8),
      asset.precision,
      common.stringToECPoint(asset.owner),
      common.stringToUInt160(addressToScriptHash(asset.admin)),
      common.stringToUInt160(addressToScriptHash(asset.issuer)),
    );

    return this.invokeRaw({
      invokeMethodOptionsOrScript: sb.build(),
      options,
      onConfirm: async ({ receipt, data }): Promise<RegisterAssetReceipt> => {
        let result;
        if (data.result.state === 'FAULT') {
          result = await this.getInvocationResultError(data, data.result);
        } else {
          const createdAsset = data.asset;
          if (createdAsset === undefined) {
            /* istanbul ignore next */
            throw new InvalidTransactionError(
              'Something went wrong! Expected a asset to have been created, but none was found',
            );
          }

          result = await this.getInvocationResultSuccess(data, data.result, createdAsset);
        }

        return {
          blockIndex: receipt.blockIndex,
          blockHash: receipt.blockHash,
          transactionIndex: receipt.transactionIndex,
          globalIndex: receipt.globalIndex,
          result,
        };
      },
      method: 'registerAsset',
    });
  }

  public async issue(
    transfers: readonly Transfer[],
    options?: TransactionOptions,
  ): Promise<TransactionResult<TransactionReceipt, IssueTransaction>> {
    const { from, attributes, networkFee } = this.getTransactionOptions(options);

    return this.capture(
      async () => {
        if (transfers.length === 0) {
          throw new NothingToIssueError();
        }

        const settings = await this.provider.getNetworkSettings(from.network);
        const { inputs, outputs } = await this.getTransfersInputOutputs({
          transfers: [],
          from,
          gas: networkFee.plus(settings.issueGASFee),
        });

        const issueOutputs = outputs.concat(
          transfers.map((transfer) => ({
            address: transfer.to,
            asset: transfer.asset,
            value: transfer.amount,
          })),
        );

        const transaction = new IssueTransactionModel({
          inputs: this.convertInputs(inputs),
          outputs: this.convertOutputs(issueOutputs),
          attributes: this.convertAttributes(attributes),
        });

        return this.sendTransaction<IssueTransaction>({
          inputs,
          from,
          transaction,
          onConfirm: async ({ receipt }) => receipt,
        });
      },
      {
        title: 'neo_issue',
      },
    );
  }

  public async __execute(
    script: BufferString,
    options: InvokeExecuteTransactionOptions = {},
    sourceMaps: SourceMaps = {},
  ): Promise<TransactionResult<RawInvokeReceipt, InvocationTransaction>> {
    const { from } = this.getTransactionOptions(options);

    return this.invokeRaw({
      invokeMethodOptionsOrScript: Buffer.from(script, 'hex'),
      options,
      transfers: options.transfers === undefined ? [] : options.transfers.map((transfer) => ({ ...transfer, from })),
      onConfirm: ({ receipt, data }): RawInvokeReceipt => ({
        blockIndex: receipt.blockIndex,
        blockHash: receipt.blockHash,
        transactionIndex: receipt.transactionIndex,
        globalIndex: receipt.globalIndex,
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
  ): Promise<TransactionResult<PublishReceipt, InvocationTransaction>> {
    const contract = new ContractModel({
      script: Buffer.from(contractIn.script, 'hex'),
      parameterList: contractIn.parameters.map(toContractParameterType),
      returnType: toContractParameterType(contractIn.returnType),
      name: contractIn.name,
      codeVersion: contractIn.codeVersion,
      author: contractIn.author,
      email: contractIn.email,
      description: contractIn.description,
      contractProperties: getContractProperties({
        hasDynamicInvoke: contractIn.dynamicInvoke,
        hasStorage: contractIn.storage,
        payable: contractIn.payable,
      }),
    });

    const sb = new ScriptBuilder();
    sb.emitSysCall(
      'Neo.Contract.Create',
      contract.script,
      Buffer.from([...contract.parameterList]),
      contract.returnType,
      contract.contractProperties,
      contract.name,
      contract.codeVersion,
      contract.author,
      contract.email,
      contract.description,
    );
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
          result,
        };
      },
      sourceMaps,
      method,
    });
  }

  protected async getInvocationResultError(
    data: RawInvocationData,
    result: RawInvocationResultError,
    sourceMaps: SourceMaps = {},
  ): Promise<InvocationResultError> {
    const message = await processActionsAndMessage({
      actions: data.actions,
      message: result.message,
      sourceMaps,
    });

    return {
      state: result.state,
      gasConsumed: result.gasConsumed,
      gasCost: result.gasCost,
      message,
    };
  }

  protected async getInvocationResultSuccess<T>(
    data: RawInvocationData,
    result: RawInvocationResultSuccess,
    value: T,
    sourceMaps: SourceMaps = {},
  ): Promise<InvocationResultSuccess<T>> {
    await processConsoleLogMessages({
      actions: data.actions,
      sourceMaps,
    });

    return {
      state: result.state,
      gasConsumed: result.gasConsumed,
      gasCost: result.gasCost,
      value,
    };
  }
}
