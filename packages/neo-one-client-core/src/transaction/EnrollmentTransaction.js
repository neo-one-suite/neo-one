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
  type TransactionGetScriptHashesForVerifyingOptions,
  type TransactionVerifyOptions,
} from './TransactionBase';
import { InvalidFormatError, VerifyError } from '../errors';
import type Witness from '../Witness';

import common, { type ECPoint, type UInt160Hex } from '../common';
import crypto from '../crypto';
import utils, { type BinaryWriter, IOHelper, JSONHelper } from '../utils';

export type EnrollmentTransactionAdd = {|
  ...TransactionBaseAdd,
  publicKey: ECPoint,
|};

export type EnrollmentTransactionJSON = {|
  ...TransactionBaseJSON,
  type: 'EnrollmentTransaction',
  pubkey: string,
|};

export default class EnrollmentTransaction extends TransactionBase<
  typeof TRANSACTION_TYPE.ENROLLMENT,
  EnrollmentTransactionJSON,
> {
  publicKey: ECPoint;
  __size: () => number;
  __enrollmentGetScriptHashesForVerifying: (
    options: TransactionGetScriptHashesForVerifyingOptions,
  ) => Promise<Set<UInt160Hex>>;

  constructor({
    version,
    attributes,
    inputs,
    outputs,
    scripts,
    hash,
    publicKey,
  }: EnrollmentTransactionAdd) {
    super({
      version,
      type: TRANSACTION_TYPE.ENROLLMENT,
      attributes,
      inputs,
      outputs,
      scripts,
      hash,
    });
    this.publicKey = publicKey;

    if (this.version !== 0) {
      throw new InvalidFormatError();
    }

    this.__size = utils.lazy(
      () =>
        super.size +
        IOHelper.sizeOfUInt8 +
        IOHelper.sizeOfECPoint(this.publicKey),
    );
    this.__enrollmentGetScriptHashesForVerifying = utils.lazyAsync(
      async (options: TransactionGetScriptHashesForVerifyingOptions) => {
        const hashes = await super.getScriptHashesForVerifying(options);
        return new Set([
          ...hashes,
          common.uInt160ToHex(crypto.getVerificationScriptHash(this.publicKey)),
        ]);
      },
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
      publicKey: this.publicKey,
    });
  }

  serializeExclusiveBase(writer: BinaryWriter): void {
    writer.writeECPoint(this.publicKey);
  }

  static deserializeWireBase(options: DeserializeWireBaseOptions): this {
    const { reader } = options;

    const { type, version } = super.deserializeTransactionBaseStartWireBase(
      options,
    );
    if (type !== TRANSACTION_TYPE.ENROLLMENT) {
      throw new InvalidFormatError();
    }

    const publicKey = reader.readECPoint();

    const {
      attributes,
      inputs,
      outputs,
      scripts,
    } = super.deserializeTransactionBaseEndWireBase(options);

    return new this({
      version,
      publicKey,
      attributes,
      inputs,
      outputs,
      scripts,
    });
  }

  async serializeJSON(
    context: SerializeJSONContext,
  ): Promise<EnrollmentTransactionJSON> {
    const transactionBaseJSON = await super.serializeTransactionBaseJSON(
      context,
    );

    return {
      type: 'EnrollmentTransaction',
      txid: transactionBaseJSON.txid,
      size: transactionBaseJSON.size,
      version: transactionBaseJSON.version,
      attributes: transactionBaseJSON.attributes,
      vin: transactionBaseJSON.vin,
      vout: transactionBaseJSON.vout,
      scripts: transactionBaseJSON.scripts,
      sys_fee: transactionBaseJSON.sys_fee,
      net_fee: transactionBaseJSON.net_fee,
      pubkey: JSONHelper.writeECPoint(this.publicKey),
    };
  }

  async getScriptHashesForVerifying(
    options: TransactionGetScriptHashesForVerifyingOptions,
  ): Promise<Set<UInt160Hex>> {
    return this.__enrollmentGetScriptHashesForVerifying(options);
  }

  // eslint-disable-next-line
  async verify(options: TransactionVerifyOptions): Promise<void> {
    throw new VerifyError('Enrollment transactions are obsolete');
  }
}
