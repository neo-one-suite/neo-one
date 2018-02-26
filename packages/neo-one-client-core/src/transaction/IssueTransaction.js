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
  type TransactionGetScriptHashesForVerifyingOptions,
  type TransactionVerifyOptions,
} from './TransactionBase';
import { InvalidFormatError, VerifyError } from '../errors';
import type Witness from '../Witness';

import common, { type UInt160Hex } from '../common';
import utils, { IOHelper } from '../utils';

export type IssueTransactionAdd = {|
  ...TransactionBaseAdd,
|};

export type IssueTransactionJSON = {|
  ...TransactionBaseJSON,
  type: 'IssueTransaction',
|};

export default class IssueTransaction extends TransactionBase<
  typeof TRANSACTION_TYPE.ISSUE,
  IssueTransactionJSON,
> {
  // TODO: How is version set?
  // static VERSION = 1;

  __size: () => number;
  __issueGetScriptHashesForVerifying: (
    options: TransactionGetScriptHashesForVerifyingOptions,
  ) => Promise<Set<UInt160Hex>>;

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
      type: TRANSACTION_TYPE.ISSUE,
      attributes,
      inputs,
      outputs,
      scripts,
      hash,
    });

    if (this.version > 1) {
      throw new InvalidFormatError();
    }
    this.__size = utils.lazy(() => super.size + IOHelper.sizeOfUInt8);
    this.__issueGetScriptHashesForVerifying = utils.lazyAsync(
      async (options: TransactionGetScriptHashesForVerifyingOptions) => {
        const { getOutput, getAsset } = options;
        const [hashes, issuerHashes] = await Promise.all([
          super.getScriptHashesForVerifying(options),
          this.getTransactionResults({ getOutput }).then(results =>
            Promise.all(
              commonUtils
                .entries(results)
                // eslint-disable-next-line
                .filter(([_, value]) => value.lt(utils.ZERO))
                // eslint-disable-next-line
                .map(async ([hash, _]) => {
                  const asset = await getAsset({
                    hash: common.hexToUInt256(hash),
                  });
                  return common.uInt160ToHex(asset.issuer);
                }),
            ),
          ),
        ]);
        return new Set([...hashes, ...issuerHashes]);
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
    });
  }

  static deserializeWireBase(options: DeserializeWireBaseOptions): this {
    const { type, version } = super.deserializeTransactionBaseStartWireBase(
      options,
    );
    if (type !== TRANSACTION_TYPE.ISSUE) {
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
  ): Promise<IssueTransactionJSON> {
    const transactionBaseJSON = await super.serializeTransactionBaseJSON(
      context,
    );

    return {
      type: 'IssueTransaction',
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

  getSystemFee(context: FeeContext): BN {
    if (this.version >= 1) {
      return utils.ZERO;
    }

    const { governingToken, utilityToken } = context;
    if (
      this.outputs.every(
        output =>
          common.uInt256Equal(output.asset, governingToken.hash) ||
          common.uInt256Equal(output.asset, utilityToken.hash),
      )
    ) {
      return utils.ZERO;
    }

    return super.getSystemFee(context);
  }

  async getScriptHashesForVerifying(
    options: TransactionGetScriptHashesForVerifyingOptions,
  ): Promise<Set<UInt160Hex>> {
    return this.__issueGetScriptHashesForVerifying(options);
  }

  async verify(options: TransactionVerifyOptions): Promise<void> {
    await Promise.all([super.verify(options), this._verify(options)]);
  }

  async _verify(options: TransactionVerifyOptions): Promise<void> {
    const { getOutput, getAsset, memPool = [] } = options;
    const results = await this.getTransactionResults({ getOutput });
    await Promise.all(
      commonUtils.entries(results).map(async ([assetHex, value]) => {
        const hash = common.hexToUInt256(assetHex);
        const asset = await getAsset({ hash });
        if (asset.amount.lt(utils.ZERO)) {
          return;
        }

        const issued = asset.available.add(
          memPool
            .filter(transaction => transaction !== this)
            .reduce(
              (acc, transaction) =>
                transaction.outputs
                  .filter(output => common.uInt256Equal(hash, output.asset))
                  .reduce(
                    (innerAcc, output) => innerAcc.add(output.value),
                    acc,
                  ),
              utils.ZERO,
            ),
        );
        if (asset.amount.sub(issued).lt(value.neg())) {
          throw new VerifyError('Invalid issue amount');
        }
      }),
    );
  }
}
