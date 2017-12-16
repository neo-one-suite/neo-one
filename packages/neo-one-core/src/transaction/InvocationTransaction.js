/* @flow */
import type BN from 'bn.js';

import { TRANSACTION_TYPE } from './TransactionType';
import type { ActionJSON } from '../action';
import type { AssetJSON } from '../Asset';
import type { ContractJSON } from '../Contract';
import {
  type DeserializeWireBaseOptions,
  type SerializeJSONContext,
} from '../Serializable';
import type { InvocationResultJSON } from '../invocationResult';
import TransactionBase, {
  type FeeContext,
  type TransactionBaseAdd,
  type TransactionBaseJSON,
  type TransactionVerifyOptions,
} from './TransactionBase';
import { InvalidFormatError, VerifyError } from '../errors';
import type Witness from '../Witness';

import utils, { type BinaryWriter, IOHelper, JSONHelper } from '../utils';

export type InvocationTransactionAdd = {|
  ...TransactionBaseAdd,
  gas: BN,
  script: Buffer,
|};

export type BasicInvocationTransactionJSON = {|
  ...TransactionBaseJSON,
  type: 'InvocationTransaction',
  script: string,
  gas: string,
|};

export type InvocationTransactionJSON = {|
  ...BasicInvocationTransactionJSON,
  result: InvocationResultJSON,
  asset?: AssetJSON,
  contracts: Array<ContractJSON>,
  actions: Array<ActionJSON>,
|};

export default class InvocationTransaction extends TransactionBase<
  typeof TRANSACTION_TYPE.INVOCATION,
  InvocationTransactionJSON,
> {
  static VERSION = 1;

  gas: BN;
  script: Buffer;

  __size: () => number;

  constructor({
    version,
    attributes,
    inputs,
    outputs,
    scripts,
    hash,
    gas,
    script,
  }: InvocationTransactionAdd) {
    super({
      version,
      type: TRANSACTION_TYPE.INVOCATION,
      attributes,
      inputs,
      outputs,
      scripts,
      hash,
    });
    this.gas = gas;
    this.script = script;

    if (this.version > 1) {
      throw new InvalidFormatError();
    }

    if (this.script.length === 0) {
      throw new InvalidFormatError();
    }

    if (this.gas.lt(utils.ZERO)) {
      throw new InvalidFormatError();
    }

    this.__size = utils.lazy(
      () =>
        super.size +
        IOHelper.sizeOfUInt8 +
        // TODO: Doesn't seem to add size of GAS
        IOHelper.sizeOfVarBytesLE(this.script),
    );
  }

  get size(): number {
    return this.__size();
  }

  clone(scripts: Array<Witness>): this {
    return new this.constructor({
      version: this.version,
      attributes: this.attributes,
      inputs: this.inputs,
      outputs: this.outputs,
      scripts,
      gas: this.gas,
      script: this.script,
    });
  }

  serializeExclusiveBase(writer: BinaryWriter): void {
    writer.writeVarBytesLE(this.script);
    if (this.version >= 1) {
      writer.writeFixed8(this.gas);
    }
  }

  static deserializeWireBase(options: DeserializeWireBaseOptions): this {
    const { reader } = options;

    const { type, version } = super.deserializeTransactionBaseStartWireBase(
      options,
    );
    if (type !== TRANSACTION_TYPE.INVOCATION) {
      throw new InvalidFormatError();
    }

    const script = reader.readVarBytesLE(65536);
    if (script.length === 0) {
      throw new InvalidFormatError();
    }

    let gas = utils.ZERO;
    if (version >= 1) {
      gas = reader.readFixed8();
    }

    const {
      attributes,
      inputs,
      outputs,
      scripts,
    } = super.deserializeTransactionBaseEndWireBase(options);

    return new this({
      version,
      attributes,
      inputs,
      outputs,
      scripts,
      script,
      gas,
    });
  }

  // eslint-disable-next-line
  async serializeJSON(
    context: SerializeJSONContext,
  ): Promise<InvocationTransactionJSON> {
    const transactionBaseJSON = await super.serializeTransactionBaseJSON(
      context,
    );

    const {
      asset,
      contracts,
      actions,
      result,
    } = await context.getInvocationData(this);

    const json = {
      type: 'InvocationTransaction',
      txid: transactionBaseJSON.txid,
      size: transactionBaseJSON.size,
      version: transactionBaseJSON.version,
      attributes: transactionBaseJSON.attributes,
      vin: transactionBaseJSON.vin,
      vout: transactionBaseJSON.vout,
      scripts: transactionBaseJSON.scripts,
      sys_fee: transactionBaseJSON.sys_fee,
      net_fee: transactionBaseJSON.net_fee,
      script: JSONHelper.writeBuffer(this.script),
      gas: JSONHelper.writeFixed8(this.gas),
      result: result.serializeJSON(context),
      asset: asset == null ? undefined : asset.serializeJSON(context),
      contracts: contracts.map(contract => contract.serializeJSON(context)),
      actions: actions.map(action => action.serializeJSON(context)),
    };
    if (asset == null) {
      delete json.asset;
    }

    return json;
  }

  // eslint-disable-next-line
  getSystemFee(context: FeeContext): BN {
    return this.gas;
  }

  // eslint-disable-next-line
  async verify(options: TransactionVerifyOptions): Promise<void> {
    if (!this.gas.mod(utils.ONE_HUNDRED_MILLION).eq(utils.ZERO)) {
      throw new VerifyError('Invalid GAS amount');
    }

    await super.verify(options);
  }
}
