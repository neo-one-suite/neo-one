/* @flow */
import { TRANSACTION_TYPE } from './TransactionType';
import { type Attribute } from './attribute';
import {
  type DeserializeWireBaseOptions,
  type SerializeJSONContext,
} from '../Serializable';
import TransactionBase, {
  type TransactionBaseAdd,
  type TransactionBaseJSON,
} from './TransactionBase';
import { InvalidFormatError } from '../errors';
import type Witness from '../Witness';

import utils, { IOHelper } from '../utils';

export type ContractTransactionAdd = TransactionBaseAdd;

export type ContractTransactionJSON = {|
  ...TransactionBaseJSON,
  type: 'ContractTransaction',
|};

export default class ContractTransaction extends TransactionBase<
  typeof TRANSACTION_TYPE.CONTRACT,
  ContractTransactionJSON,
> {
  __size: () => number;

  constructor({
    version,
    attributes,
    inputs,
    outputs,
    scripts,
    hash,
  }: TransactionBaseAdd) {
    super({
      version,
      type: TRANSACTION_TYPE.CONTRACT,
      attributes,
      inputs,
      outputs,
      scripts,
      hash,
    });

    if (this.version !== 0) {
      throw new InvalidFormatError();
    }

    this.__size = utils.lazy(() => super.size + IOHelper.sizeOfUInt8);
  }

  get size(): number {
    return this.__size();
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
    });
  }

  static deserializeWireBase(options: DeserializeWireBaseOptions): this {
    const { type, version } = super.deserializeTransactionBaseStartWireBase(
      options,
    );
    if (type !== TRANSACTION_TYPE.CONTRACT) {
      throw new InvalidFormatError();
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
    });
  }

  async serializeJSON(
    context: SerializeJSONContext,
  ): Promise<ContractTransactionJSON> {
    const transactionBaseJSON = await super.serializeTransactionBaseJSON(
      context,
    );

    return {
      type: 'ContractTransaction',
      txid: transactionBaseJSON.txid,
      size: transactionBaseJSON.size,
      version: transactionBaseJSON.version,
      attributes: transactionBaseJSON.attributes,
      vin: transactionBaseJSON.vin,
      vout: transactionBaseJSON.vout,
      scripts: transactionBaseJSON.scripts,
      sys_fee: transactionBaseJSON.sys_fee,
      net_fee: transactionBaseJSON.net_fee,
    };
  }
}
