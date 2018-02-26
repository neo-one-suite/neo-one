/* @flow */
import type BN from 'bn.js';

import { TRANSACTION_TYPE } from './TransactionType';
import { type Attribute } from './attribute';
import {
  type DeserializeWireBaseOptions,
  type SerializeJSONContext,
} from '../Serializable';
import { type StateDescriptorJSON, StateDescriptor } from './state';
import TransactionBase, {
  type FeeContext,
  type TransactionBaseAdd,
  type TransactionBaseJSON,
  type TransactionGetScriptHashesForVerifyingOptions,
  type TransactionVerifyOptions,
} from './TransactionBase';
import { InvalidFormatError } from '../errors';
import type { UInt160Hex } from '../common';
import type Witness from '../Witness';

import utils, { type BinaryWriter, IOHelper } from '../utils';

export type StateTransactionAdd = {|
  ...TransactionBaseAdd,
  descriptors: Array<StateDescriptor>,
|};

export type StateTransactionJSON = {|
  ...TransactionBaseJSON,
  type: 'StateTransaction',
  descriptors: Array<StateDescriptorJSON>,
|};

export default class StateTransaction extends TransactionBase<
  typeof TRANSACTION_TYPE.STATE,
  StateTransactionJSON,
> {
  descriptors: Array<StateDescriptor>;

  __size: () => number;
  __stateGetScriptHashesForVerifying: (
    options: TransactionGetScriptHashesForVerifyingOptions,
  ) => Promise<Set<UInt160Hex>>;

  constructor({
    version,
    attributes,
    inputs,
    outputs,
    scripts,
    hash,
    descriptors,
  }: StateTransactionAdd) {
    super({
      version,
      type: TRANSACTION_TYPE.STATE,
      attributes,
      inputs,
      outputs,
      scripts,
      hash,
    });
    this.descriptors = descriptors;

    if (this.version !== 0) {
      throw new InvalidFormatError();
    }

    this.__size = utils.lazy(
      () =>
        super.size +
        IOHelper.sizeOfArray(this.descriptors, descriptor => descriptor.size),
    );

    this.__stateGetScriptHashesForVerifying = utils.lazyAsync(
      async (options: TransactionGetScriptHashesForVerifyingOptions) => {
        const hashes = await super.getScriptHashesForVerifying(options);
        for (const descriptor of this.descriptors) {
          for (const scriptHash of descriptor.getScriptHashesForVerifying()) {
            hashes.add(scriptHash);
          }
        }

        return hashes;
      },
    );
  }

  get size(): number {
    return this.__size();
  }

  getSystemFee(context: FeeContext): BN {
    return this.descriptors.reduce(
      (value, descriptor) => value.add(descriptor.getSystemFee(context)),
      utils.ZERO,
    );
  }

  async getScriptHashesForVerifying(
    options: TransactionGetScriptHashesForVerifyingOptions,
  ): Promise<Set<UInt160Hex>> {
    return this.__stateGetScriptHashesForVerifying(options);
  }

  clone({
    scripts,
    attributes,
  }: {|
    scripts?: Array<Witness>,
    attributes?: Array<Attribute>,
  |}): this {
    return new this.constructor({
      version: this.version,
      attributes: attributes || this.attributes,
      inputs: this.inputs,
      outputs: this.outputs,
      scripts: scripts || this.scripts,
      descriptors: this.descriptors,
    });
  }

  serializeExclusiveBase(writer: BinaryWriter): void {
    writer.writeArray(this.descriptors, descriptor => {
      descriptor.serializeWireBase(writer);
    });
  }

  static deserializeWireBase(options: DeserializeWireBaseOptions): this {
    const { reader } = options;
    const { type, version } = super.deserializeTransactionBaseStartWireBase(
      options,
    );
    if (type !== TRANSACTION_TYPE.STATE) {
      throw new InvalidFormatError();
    }

    const descriptors = reader.readArray(() =>
      StateDescriptor.deserializeWireBase(options),
    );

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
      descriptors,
    });
  }

  async serializeJSON(
    context: SerializeJSONContext,
  ): Promise<StateTransactionJSON> {
    const transactionBaseJSON = await super.serializeTransactionBaseJSON(
      context,
    );

    return {
      type: 'StateTransaction',
      txid: transactionBaseJSON.txid,
      size: transactionBaseJSON.size,
      version: transactionBaseJSON.version,
      attributes: transactionBaseJSON.attributes,
      vin: transactionBaseJSON.vin,
      vout: transactionBaseJSON.vout,
      scripts: transactionBaseJSON.scripts,
      sys_fee: transactionBaseJSON.sys_fee,
      net_fee: transactionBaseJSON.net_fee,
      descriptors: this.descriptors.map(descriptor =>
        descriptor.serializeJSON(context),
      ),
    };
  }

  async verify(options: TransactionVerifyOptions): Promise<void> {
    await Promise.all([super.verify(options), this._verify(options)]);
  }

  async _verify(options: TransactionVerifyOptions): Promise<void> {
    await Promise.all(
      this.descriptors.map(descriptor => descriptor.verify(options)),
    );
  }
}
