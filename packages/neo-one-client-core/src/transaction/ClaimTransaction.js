/* @flow */
import type BN from 'bn.js';

import { utils as commonUtils } from '@neo-one/utils';

import { TRANSACTION_TYPE } from './TransactionType';
import { type Attribute } from './attribute';
import {
  type DeserializeWireBaseOptions,
  type SerializeJSONContext,
} from '../Serializable';
import Input, { type InputJSON } from './Input';
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
import { hasDuplicateInputs, hasIntersectingInputs } from './common';
import utils, { type BinaryWriter, IOHelper } from '../utils';

export type ClaimTransactionAdd = {|
  ...TransactionBaseAdd,
  claims: Array<Input>,
|};

export type ClaimTransactionJSON = {|
  ...TransactionBaseJSON,
  type: 'ClaimTransaction',
  claims: Array<InputJSON>,
|};

export default class ClaimTransaction extends TransactionBase<
  typeof TRANSACTION_TYPE.CLAIM,
  ClaimTransactionJSON,
> {
  claims: Array<Input>;

  __size: () => number;
  __claimGetScriptHashesForVerifying: (
    options: TransactionGetScriptHashesForVerifyingOptions,
  ) => Promise<Set<UInt160Hex>>;

  constructor({
    version,
    attributes,
    inputs,
    outputs,
    scripts,
    hash,
    claims,
  }: ClaimTransactionAdd) {
    super({
      version,
      type: TRANSACTION_TYPE.CLAIM,
      attributes,
      inputs,
      outputs,
      scripts,
      hash,
    });
    this.claims = claims;

    if (this.version !== 0) {
      throw new InvalidFormatError();
    }

    if (this.claims.length === 0) {
      throw new InvalidFormatError();
    }

    this.__size = utils.lazy(
      () =>
        super.size +
        IOHelper.sizeOfUInt8 +
        IOHelper.sizeOfArray(this.claims, claim => claim.size),
    );

    this.__claimGetScriptHashesForVerifying = utils.lazyAsync(
      async (options: TransactionGetScriptHashesForVerifyingOptions) => {
        const { getOutput } = options;
        const [hashesSet, hashes] = await Promise.all([
          super.getScriptHashesForVerifying(options),
          Promise.all(
            this.claims.map(async claim => {
              const output = await getOutput(claim);
              return common.uInt160ToHex(output.address);
            }),
          ),
        ]);

        return new Set([...hashesSet, ...hashes]);
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
      claims: this.claims,
    });
  }

  serializeExclusiveBase(writer: BinaryWriter): void {
    writer.writeArray(this.claims, claim => {
      claim.serializeWireBase(writer);
    });
  }

  static deserializeWireBase(options: DeserializeWireBaseOptions): this {
    const { reader } = options;

    const { type, version } = super.deserializeTransactionBaseStartWireBase(
      options,
    );
    if (type !== TRANSACTION_TYPE.CLAIM) {
      throw new InvalidFormatError();
    }

    const claims = reader.readArray(() => Input.deserializeWireBase(options));

    const {
      attributes,
      inputs,
      outputs,
      scripts,
    } = super.deserializeTransactionBaseEndWireBase(options);

    return new this({
      version,
      claims,
      attributes,
      inputs,
      outputs,
      scripts,
    });
  }

  // eslint-disable-next-line
  async getNetworkFee(context: FeeContext): Promise<BN> {
    return utils.ZERO;
  }

  async getScriptHashesForVerifying(
    options: TransactionGetScriptHashesForVerifyingOptions,
  ): Promise<Set<UInt160Hex>> {
    return this.__claimGetScriptHashesForVerifying(options);
  }

  async verify(options: TransactionVerifyOptions): Promise<void> {
    await Promise.all([super.verify(options), this._verify(options)]);
  }

  async _verify(options: TransactionVerifyOptions): Promise<void> {
    const {
      calculateClaimAmount,
      getOutput,
      utilityToken,
      memPool = [],
    } = options;
    if (hasDuplicateInputs(this.claims)) {
      throw new VerifyError('Duplicate claims');
    }

    if (
      memPool.some(
        transaction =>
          transaction instanceof ClaimTransaction &&
          transaction.type === TRANSACTION_TYPE.CLAIM &&
          hasIntersectingInputs(this.claims, transaction.claims),
      )
    ) {
      throw new VerifyError('Dupliate claims in mempool');
    }
    const [results, claimAmount] = await Promise.all([
      this.getTransactionResults({ getOutput }),
      calculateClaimAmount(this.claims).catch(error => {
        throw new VerifyError(`Invalid claims: ${error.message}`);
      }),
    ]);
    const result = commonUtils.entries(results).find(
      // eslint-disable-next-line
      ([assetHex, _]) =>
        common.uInt256Equal(common.hexToUInt256(assetHex), utilityToken.hash),
    );
    if (result == null || result[1].gt(utils.ZERO)) {
      throw new VerifyError('Invalid claim value');
    }

    if (!claimAmount.eq(result[1].neg())) {
      throw new VerifyError('Invalid claim value');
    }
  }

  async serializeJSON(
    context: SerializeJSONContext,
  ): Promise<ClaimTransactionJSON> {
    const transactionBaseJSON = await super.serializeTransactionBaseJSON(
      context,
    );

    return {
      type: 'ClaimTransaction',
      txid: transactionBaseJSON.txid,
      size: transactionBaseJSON.size,
      version: transactionBaseJSON.version,
      attributes: transactionBaseJSON.attributes,
      vin: transactionBaseJSON.vin,
      vout: transactionBaseJSON.vout,
      scripts: transactionBaseJSON.scripts,
      sys_fee: transactionBaseJSON.sys_fee,
      net_fee: transactionBaseJSON.net_fee,
      claims: this.claims.map(claim => claim.serializeJSON(context)),
    };
  }
}
