/* @flow */
import BN from 'bn.js';
import {
  CONTRACT_PROPERTY_STATE,
  MAX_TRANSACTION_ATTRIBUTES,
  type Transaction,
  Contract as ContractModel,
  ClaimTransaction as ClaimTransactionModel,
  ContractTransaction as ContractTransactionModel,
  InvocationTransaction as InvocationTransactionModel,
  IssueTransaction as IssueTransactionModel,
  JSONHelper,
  ScriptBuilder,
  assertAssetTypeJSON,
  assertContractParameterTypeJSON,
  toAssetType,
  toContractParameterType,
  common,
  utils,
} from '@neo-one/core';

import {
  type ABI,
  type AddressLike,
  type AssetLike,
  type AttributeLike,
  type AttributeUsageBuffer,
  type Asset,
  type BasicClientBaseProvider,
  type BasicInvocationResult,
  type BlockFilter,
  type Contract,
  type ContractLike,
  type Hash160Like,
  type Hash256Like,
  type InputLike,
  type InvocationResult,
  type Output,
  type OutputLike,
  type NumberLike,
  type ParamLike,
  type PrivateKeyLike,
  type PrivateKeyLikeOrSign,
  type ScriptLike,
  type StorageItem,
  type WitnessLike,
} from './types';
import AsyncBlockIterator from './AsyncBlockIterator';
import ClientBase from './ClientBase';
import {
  NothingToClaimError,
  NothingToIssueError,
  NothingToTransferError,
} from './errors';

import converters from './converters';

type Remark =
  | 'Remark'
  | 'Remark1'
  | 'Remark2'
  | 'Remark3'
  | 'Remark4'
  | 'Remark5'
  | 'Remark6'
  | 'Remark7'
  | 'Remark8'
  | 'Remark9'
  | 'Remark10'
  | 'Remark11'
  | 'Remark12'
  | 'Remark13'
  | 'Remark14'
  | 'Remark15';
const REMARKS = [
  'Remark',
  'Remark1',
  'Remark2',
  'Remark3',
  'Remark4',
  'Remark5',
  'Remark6',
  'Remark7',
  'Remark8',
  'Remark9',
  'Remark10',
  'Remark11',
  'Remark12',
  'Remark13',
  'Remark14',
  'Remark15',
];
const REMARKS_SET = new Set(REMARKS);

export type BasicClientBaseOptions<
  TBlock,
  TTransaction,
  TAccount,
  TInvocationResult: InvocationResult | BasicInvocationResult,
  TProvider: BasicClientBaseProvider<
    TBlock,
    TTransaction,
    TAccount,
    TInvocationResult,
  >,
> = {|
  provider: TProvider,
  addressVersion?: number,
  privateKeyVersion?: number,
|};

export default class BasicClientBase<
  TBlock,
  TTransaction,
  TAccount,
  TInvocationResult: InvocationResult | BasicInvocationResult,
  TSmartContract,
  TProvider: BasicClientBaseProvider<
    TBlock,
    TTransaction,
    TAccount,
    TInvocationResult,
  >,
> extends ClientBase {
  _provider: TProvider;

  constructor(
    options: BasicClientBaseOptions<
      TBlock,
      TTransaction,
      TAccount,
      TInvocationResult,
      TProvider,
    >,
  ) {
    super({
      addressVersion: options.addressVersion,
      privateKeyVersion: options.privateKeyVersion,
    });
    this._provider = options.provider;
  }

  getAccount(address: AddressLike): Promise<TAccount> {
    return this._provider.getAccount(
      this.scriptHashToAddress(converters.hash160(this, address)),
    );
  }

  getAsset(hash: Hash256Like): Promise<Asset> {
    return this._provider.getAsset(converters.hash256(hash));
  }

  getBlock(hashOrIndex: Hash256Like | number): Promise<TBlock> {
    return this._provider.getBlock(
      typeof hashOrIndex === 'number'
        ? hashOrIndex
        : converters.hash256(hashOrIndex),
    );
  }

  getBestBlockHash(): Promise<string> {
    return this._provider.getBestBlockHash();
  }

  getBlockCount(): Promise<number> {
    return this._provider.getBlockCount();
  }

  getContract(hash: Hash160Like): Promise<Contract> {
    return this._provider.getContract(converters.hash160(this, hash));
  }

  getMemPool(): Promise<Array<string>> {
    return this._provider.getMemPool();
  }

  getTransaction(hash: Hash256Like): Promise<TTransaction> {
    return this._provider.getTransaction(converters.hash256(hash));
  }

  getStorage(hash: Hash160Like, key: ScriptLike): Promise<StorageItem> {
    return this._provider.getStorage(
      converters.hash160(this, hash),
      converters.script(key),
    );
  }

  getUnspentOutput(input: InputLike): Promise<?Output> {
    return this._provider.getUnspentOutput(converters.input(input));
  }

  testInvokeRaw(script: ScriptLike): Promise<TInvocationResult> {
    return this._provider.testInvokeRaw(converters.script(script));
  }

  // eslint-disable-next-line
  contract(abi: ABI): TSmartContract {
    throw new Error('Not Implemented');
  }

  testInvokeMethodRaw({
    hash,
    method,
    params,
  }: {|
    hash: Hash160Like,
    method: string,
    params: Array<ParamLike>,
  |}): Promise<TInvocationResult> {
    return this.testInvokeRaw(
      this._getInvokeMethodScript({
        hash,
        method,
        params,
      }),
    );
  }

  iterBlocks(filter: BlockFilter): AsyncIterator<TBlock> {
    return new AsyncBlockIterator({ filter, client: this });
  }

  transferRaw({
    inputs,
    outputs,
    privateKey,
    attributes,
    scripts,
  }: {|
    inputs: Array<InputLike>,
    outputs: Array<OutputLike>,
    privateKey: PrivateKeyLikeOrSign,
    attributes?: Array<AttributeLike>,
    scripts?: Array<WitnessLike>,
  |}): Promise<string> {
    if (inputs.length === 0) {
      throw new NothingToTransferError();
    }

    const transaction = new ContractTransactionModel({
      inputs: this._convertInputs(inputs),
      outputs: this._convertOutputs(outputs),
      attributes: this._convertAttributes(attributes),
      scripts: this._convertWitnesses(scripts),
    });
    return this._sendTransaction(transaction, privateKey);
  }

  claimRaw({
    claims,
    outputs,
    privateKey,
    inputs,
    attributes,
    scripts,
  }: {|
    claims: Array<InputLike>,
    outputs: Array<OutputLike>,
    privateKey: PrivateKeyLikeOrSign,
    inputs?: Array<InputLike>,
    attributes?: Array<AttributeLike>,
    scripts?: Array<WitnessLike>,
  |}): Promise<string> {
    if (claims.length === 0) {
      throw new NothingToClaimError();
    }

    const transaction = new ClaimTransactionModel({
      claims: this._convertInputs(claims),
      outputs: this._convertOutputs(outputs),
      inputs: this._convertInputs(inputs),
      attributes: this._convertAttributes(attributes),
      scripts: this._convertWitnesses(scripts),
    });
    return this._sendTransaction(transaction, privateKey);
  }

  async invokeRaw({
    script,
    privateKey,
    gas,
    inputs,
    outputs,
    attributes,
    scripts,
  }: {|
    script: ScriptLike,
    privateKey: PrivateKeyLikeOrSign,
    gas?: NumberLike,
    inputs?: Array<InputLike>,
    outputs?: Array<OutputLike>,
    attributes?: Array<AttributeLike>,
    scripts?: Array<WitnessLike>,
  |}): Promise<string> {
    const transaction = this._getInvocationTransaction({
      script,
      inputs,
      outputs,
      gas,
      attributes,
      scripts,
      privateKey,
    });
    const txid = await this._sendTransaction(transaction, privateKey);

    return txid;
  }

  invokeMethodRaw({
    hash,
    method,
    params,
    privateKey,
    gas,
    inputs,
    outputs,
    attributes,
    scripts,
  }: {|
    hash: Hash160Like,
    method: string,
    params: Array<ParamLike>,
    privateKey: PrivateKeyLikeOrSign,
    gas?: NumberLike,
    inputs?: Array<InputLike>,
    outputs?: Array<OutputLike>,
    attributes?: Array<AttributeLike>,
    scripts?: Array<WitnessLike>,
  |}): Promise<string> {
    return this.invokeRaw({
      script: this._getInvokeMethodScript({
        hash,
        method,
        params,
      }),
      privateKey,
      gas,
      inputs,
      outputs,
      attributes,
      scripts,
    });
  }

  async publishRaw({
    contract,
    inputs,
    privateKey,
    outputs,
    attributes,
    scripts,
  }: {|
    contract: ContractLike,
    inputs: Array<InputLike>,
    privateKey: PrivateKeyLikeOrSign,
    outputs?: Array<OutputLike>,
    attributes?: Array<AttributeLike>,
    scripts?: Array<WitnessLike>,
  |}): Promise<{| txid: string, hash: string |}> {
    const { script, hash } = this._getContractAndScript({ contract });

    const txid = await this.invokeRaw({
      script,
      inputs,
      privateKey,
      outputs,
      attributes,
      scripts,
    });

    return { txid, hash };
  }

  registerRaw({
    asset,
    inputs,
    privateKey,
    outputs,
    attributes,
    scripts,
  }: {|
    asset: AssetLike,
    inputs: Array<InputLike>,
    privateKey: PrivateKeyLikeOrSign,
    outputs?: Array<OutputLike>,
    attributes?: Array<AttributeLike>,
    scripts?: Array<WitnessLike>,
  |}): Promise<string> {
    const script = this._getAssetScript({ asset });

    return this.invokeRaw({
      script,
      inputs,
      privateKey,
      outputs,
      attributes,
      scripts,
    });
  }

  issueRaw({
    inputs,
    outputs,
    privateKey,
    attributes,
    scripts,
  }: {|
    inputs: Array<InputLike>,
    outputs: Array<OutputLike>,
    privateKey: PrivateKeyLikeOrSign,
    attributes?: Array<AttributeLike>,
    scripts?: Array<WitnessLike>,
  |}): Promise<string> {
    if (outputs.length === 0) {
      throw new NothingToIssueError();
    }

    const transaction = new IssueTransactionModel({
      inputs: this._convertInputs(inputs),
      outputs: this._convertOutputs(outputs),
      attributes: this._convertAttributes(attributes),
      scripts: this._convertWitnesses(scripts),
    });
    return this._sendTransaction(transaction, privateKey);
  }

  _getContractAndScript({
    contract: contractIn,
  }: {|
    contract: ContractLike,
  |}): {| script: Buffer, hash: string |} {
    let contractProperties = CONTRACT_PROPERTY_STATE.NO_PROPERTY;
    if (contractIn.hasStorage && contractIn.hasDynamicInvoke) {
      contractProperties = CONTRACT_PROPERTY_STATE.HAS_STORAGE_DYNAMIC_INVOKE;
    } else if (contractIn.hasStorage) {
      contractProperties = CONTRACT_PROPERTY_STATE.HAS_STORAGE;
    } else if (contractIn.hasDynamicInvoke) {
      contractProperties = CONTRACT_PROPERTY_STATE.HAS_DYNAMIC_INVOKE;
    }
    const contract = new ContractModel({
      script: converters.script(contractIn.script),
      parameterList: contractIn.parameters.map(parameter =>
        toContractParameterType(assertContractParameterTypeJSON(parameter)),
      ),
      returnType: toContractParameterType(
        assertContractParameterTypeJSON(contractIn.returnType),
      ),
      name: contractIn.name,
      codeVersion: contractIn.codeVersion,
      author: contractIn.author,
      email: contractIn.email,
      description: contractIn.description,
      contractProperties,
    });

    const sb = new ScriptBuilder();
    sb.emitSysCall(
      'Neo.Contract.Create',
      contract.script,
      Buffer.from(contract.parameterList),
      contract.returnType,
      contract.hasStorage,
      contract.name,
      contract.codeVersion,
      contract.author,
      contract.email,
      contract.description,
    );

    return { script: sb.build(), hash: common.uInt160ToString(contract.hash) };
  }

  _getAssetScript({ asset }: {| asset: AssetLike |}): Buffer {
    const sb = new ScriptBuilder();
    sb.emitSysCall(
      'Neo.Asset.Create',
      toAssetType(assertAssetTypeJSON(asset.assetType)),
      asset.name,
      converters.number(asset.amount, 8),
      asset.precision,
      converters.publicKey(asset.owner),
      converters.hash160(this, asset.admin),
      converters.hash160(this, asset.issuer),
    );

    return sb.build();
  }

  async _sendTransaction(
    transactionUnsigned: Transaction,
    privateKey: PrivateKeyLikeOrSign,
  ): Promise<string> {
    const { txid } = await this._sendTransactionBase(
      transactionUnsigned,
      privateKey,
      value => this._sendTransactionRaw(value),
    );

    return txid;
  }

  async _sendTransactionBase<T>(
    transactionUnsigned: Transaction,
    privateKey: PrivateKeyLikeOrSign,
    sendRaw: (value: Buffer) => Promise<T>,
  ): Promise<{| txid: string, transaction: Transaction, result: T |}> {
    let transaction;
    if (
      !(privateKey instanceof Buffer) &&
      !(typeof privateKey === 'string') &&
      typeof privateKey === 'object' &&
      privateKey.sign != null &&
      typeof privateKey.sign === 'function' &&
      privateKey.publicKey != null
    ) {
      const signature = await privateKey.sign(
        transactionUnsigned.serializeUnsigned().toString('hex'),
      );
      transaction = transactionUnsigned.signWithSignature(
        converters.script(signature),
        converters.publicKey(privateKey.publicKey),
      );
    } else {
      transaction = transactionUnsigned.sign(
        converters.privateKey(this, ((privateKey: $FlowFixMe): PrivateKeyLike)),
      );
    }
    const result = await sendRaw(transaction.serializeWire());
    return {
      txid: JSONHelper.writeUInt256(transaction.hash),
      transaction,
      result,
    };
  }

  _sendTransactionRaw(value: Buffer): Promise<void> {
    return this._provider.sendTransactionRaw(value);
  }

  _getInvokeMethodScript({
    hash,
    method,
    params,
  }: {|
    hash: Hash160Like,
    method: string,
    params: Array<ParamLike>,
  |}): Buffer {
    const sb = new ScriptBuilder();
    sb.emitAppCall(
      converters.hash160(this, hash),
      method,
      ...this._convertParams(params),
    );

    return sb.build();
  }

  _getInvocationTransaction({
    script,
    privateKey,
    gas,
    inputs,
    outputs,
    attributes: attributesIn,
    scripts,
  }: {|
    script: ScriptLike,
    privateKey: PrivateKeyLikeOrSign,
    gas?: NumberLike,
    inputs?: Array<InputLike>,
    outputs?: Array<OutputLike>,
    attributes?: Array<AttributeLike>,
    scripts?: Array<WitnessLike>,
  |}): InvocationTransactionModel {
    const attributes = attributesIn || [];
    if (
      !attributes.some(attribute => attribute.usage === 'Script') &&
      attributes.length + 1 < MAX_TRANSACTION_ATTRIBUTES
    ) {
      attributes.push({
        usage: 'Script',
        value: this.addressToScriptHash(this._getAddress(privateKey)),
      });
    }

    const remark = this._findRemark(attributes);
    if (remark != null && attributes.length + 1 < MAX_TRANSACTION_ATTRIBUTES) {
      attributes.push({
        usage: (remark: AttributeUsageBuffer),
        value: utils.toSignedBuffer(new BN(utils.randomUInt())),
      });
    }

    return new InvocationTransactionModel({
      version: 1,
      inputs: this._convertInputs(inputs),
      outputs: this._convertOutputs(outputs),
      attributes: this._convertAttributes(attributes),
      gas: gas == null ? utils.ZERO : converters.number(gas, 8),
      script: converters.script(script),
      scripts: this._convertWitnesses(scripts),
    });
  }

  _findRemark(attributes: Array<AttributeLike>): ?Remark {
    const remarks = new Set(
      attributes
        .filter(attribute => REMARKS_SET.has(attribute.usage))
        .map(attribute => attribute.usage),
    );
    for (const remark of REMARKS) {
      if (!remarks.has(remark)) {
        return remark;
      }
    }

    return null;
  }
}
