/* @flow */
import type BN from 'bn.js';

import { utils as commonUtils } from '@neo-one/utils';

import { TRANSACTION_TYPE } from './TransactionType';
import { type Attribute } from './attribute';
import {
  type DeserializeWireBaseOptions,
  type SerializeJSONContext,
} from '../Serializable';
import TransactionBase, {
  type FeeContext,
  type TransactionBaseAdd,
  type TransactionBaseJSON,
  type TransactionVerifyOptions,
} from './TransactionBase';
import { InvalidFormatError, VerifyError } from '../errors';
import type Witness from '../Witness';

import common from '../common';
import utils, { type BinaryWriter, IOHelper } from '../utils';

export type MinerTransactionAdd = {|
  ...TransactionBaseAdd,
  nonce: number,
|};

export type MinerTransactionJSON = {|
  ...TransactionBaseJSON,
  type: 'MinerTransaction',
  nonce: number,
|};

export default class MinerTransaction extends TransactionBase<
  typeof TRANSACTION_TYPE.MINER,
  MinerTransactionJSON,
> {
  nonce: number;

  __size: () => number;

  constructor({
    version,
    attributes,
    inputs,
    outputs,
    scripts,
    hash,
    nonce,
  }: MinerTransactionAdd) {
    super({
      version,
      type: TRANSACTION_TYPE.MINER,
      attributes,
      inputs,
      outputs,
      scripts,
      hash,
    });
    this.nonce = nonce;

    if (this.version !== 0) {
      throw new InvalidFormatError();
    }

    this.__size = utils.lazy(
      () => super.size + IOHelper.sizeOfUInt8 + IOHelper.sizeOfUInt32LE,
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
      nonce: this.nonce,
    });
  }

  serializeExclusiveBase(writer: BinaryWriter): void {
    writer.writeUInt32LE(this.nonce);
  }

  static deserializeWireBase(options: DeserializeWireBaseOptions): this {
    const { reader } = options;
    const { type, version } = super.deserializeTransactionBaseStartWireBase(
      options,
    );
    if (type !== TRANSACTION_TYPE.MINER) {
      throw new InvalidFormatError();
    }

    const nonce = reader.readUInt32LE();

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
      nonce,
    });
  }

  async serializeJSON(
    context: SerializeJSONContext,
  ): Promise<MinerTransactionJSON> {
    const transactionBaseJSON = await super.serializeTransactionBaseJSON(
      context,
    );

    return {
      type: 'MinerTransaction',
      txid: transactionBaseJSON.txid,
      size: transactionBaseJSON.size,
      version: transactionBaseJSON.version,
      attributes: transactionBaseJSON.attributes,
      vin: transactionBaseJSON.vin,
      vout: transactionBaseJSON.vout,
      scripts: transactionBaseJSON.scripts,
      sys_fee: transactionBaseJSON.sys_fee,
      net_fee: transactionBaseJSON.net_fee,
      nonce: this.nonce,
    };
  }

  // eslint-disable-next-line
  async getNetworkFee(context: FeeContext): Promise<BN> {
    return utils.ZERO;
  }

  async verify(options: TransactionVerifyOptions): Promise<void> {
    await Promise.all([super.verify(options), this._verify(options)]);
  }

  async _verify(options: TransactionVerifyOptions): Promise<void> {
    const { getOutput, utilityToken } = options;
    const results = await this.getTransactionResults({ getOutput });
    const resultsIssue = commonUtils.entries(results).filter(
      // eslint-disable-next-line
      ([_, value]) => value.lt(utils.ZERO),
    );

    if (
      resultsIssue.some(
        // eslint-disable-next-line
        ([assetHex, _]) =>
          !common.uInt256Equal(
            common.hexToUInt256(assetHex),
            utilityToken.hash,
          ),
      )
    ) {
      throw new VerifyError('Invalid miner result');
    }
  }
}
