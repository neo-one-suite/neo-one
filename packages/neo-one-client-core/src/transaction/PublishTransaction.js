/* @flow */
import { TRANSACTION_TYPE } from './TransactionType';
import { type Attribute } from './attribute';
import Contract, {
  type ContractJSON,
  serializeContractWireBase,
  deserializeContractWireBase,
  sizeOfContract,
} from '../Contract';
import {
  type DeserializeWireBaseOptions,
  type SerializeJSONContext,
} from '../Serializable';
import TransactionBase, {
  type TransactionBaseAdd,
  type TransactionBaseJSON,
  type TransactionVerifyOptions,
} from './TransactionBase';
import { InvalidFormatError, VerifyError } from '../errors';
import type Witness from '../Witness';

import utils, { type BinaryWriter, IOHelper } from '../utils';

export type PublishTransactionAdd = {|
  ...TransactionBaseAdd,
  contract: Contract,
|};

export type PublishTransactionJSON = {|
  ...TransactionBaseJSON,
  type: 'PublishTransaction',
  contract: ContractJSON,
|};

export default class PublishTransaction extends TransactionBase<
  typeof TRANSACTION_TYPE.PUBLISH,
  PublishTransactionJSON,
> {
  // TODO: How is version set?
  // static VERSION = 1;
  contract: Contract;

  __size: () => number;

  constructor({
    version,
    attributes,
    inputs,
    outputs,
    scripts,
    hash,
    contract,
  }: PublishTransactionAdd) {
    super({
      version,
      type: TRANSACTION_TYPE.PUBLISH,
      attributes,
      inputs,
      outputs,
      scripts,
      hash,
    });
    this.contract = contract;

    if (this.version > 1) {
      throw new InvalidFormatError();
    }

    this.__size = utils.lazy(
      () =>
        super.size +
        IOHelper.sizeOfUInt8 +
        sizeOfContract({
          script: this.contract.script,
          parameterList: this.contract.parameterList,
          name: this.contract.name,
          codeVersion: this.contract.codeVersion,
          author: this.contract.author,
          email: this.contract.email,
          description: this.contract.description,
          publishVersion: this.version,
        }),
    );
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
      contract: this.contract,
    });
  }

  serializeExclusiveBase(writer: BinaryWriter): void {
    serializeContractWireBase({
      contract: this.contract,
      writer,
      publishVersion: this.version,
    });
  }

  static deserializeWireBase(options: DeserializeWireBaseOptions): this {
    const { type, version } = super.deserializeTransactionBaseStartWireBase(
      options,
    );
    if (type !== TRANSACTION_TYPE.PUBLISH) {
      throw new InvalidFormatError();
    }

    const contract = deserializeContractWireBase({
      ...options,
      publishVersion: version,
    });

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
      contract,
    });
  }

  async serializeJSON(
    context: SerializeJSONContext,
  ): Promise<PublishTransactionJSON> {
    const transactionBaseJSON = await super.serializeTransactionBaseJSON(
      context,
    );

    return {
      type: 'PublishTransaction',
      txid: transactionBaseJSON.txid,
      size: transactionBaseJSON.size,
      version: transactionBaseJSON.version,
      attributes: transactionBaseJSON.attributes,
      vin: transactionBaseJSON.vin,
      vout: transactionBaseJSON.vout,
      scripts: transactionBaseJSON.scripts,
      sys_fee: transactionBaseJSON.sys_fee,
      net_fee: transactionBaseJSON.net_fee,
      contract: this.contract.serializeJSON(context),
    };
  }

  // eslint-disable-next-line
  async verify(options: TransactionVerifyOptions): Promise<void> {
    throw new VerifyError('Enrollment transactions are obsolete');
  }
}
