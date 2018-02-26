/* @flow */
import type BN from 'bn.js';

import { TRANSACTION_TYPE } from './TransactionType';
import { type Attribute } from './attribute';
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

import common from '../common';
import crypto from '../crypto';
import utils, { type BinaryWriter, IOHelper, JSONHelper } from '../utils';

export type InvocationTransactionAdd = {|
  ...TransactionBaseAdd,
  gas: BN,
  script: Buffer,
|};

export type InvocationDataJSON = {|
  result: InvocationResultJSON,
  asset?: AssetJSON,
  contracts: Array<ContractJSON>,
  deletedContractHashes: Array<string>,
  migratedContractHashes: Array<[string, string]>,
  voteUpdates: Array<[string, Array<string>]>,
  actions: Array<ActionJSON>,
|};

export type InvocationTransactionJSON = {|
  ...TransactionBaseJSON,
  type: 'InvocationTransaction',
  script: string,
  gas: string,
  // TODO: Pull this out
  data?: InvocationDataJSON,
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

  async serializeJSON(
    context: SerializeJSONContext,
  ): Promise<InvocationTransactionJSON> {
    const transactionBaseJSON = await super.serializeTransactionBaseJSON(
      context,
    );

    const data = await context.tryGetInvocationData(this);
    let dataJSON;
    if (data != null) {
      const {
        asset,
        contracts,
        deletedContractHashes,
        migratedContractHashes,
        voteUpdates,
        actions,
        result,
      } = data;
      dataJSON = {
        result: result.serializeJSON(context),
        asset: asset == null ? undefined : asset.serializeJSON(context),
        contracts: contracts.map(contract => contract.serializeJSON(context)),
        deletedContractHashes: deletedContractHashes.map(hash =>
          common.uInt160ToString(hash),
        ),
        migratedContractHashes: migratedContractHashes.map(([from, to]) => [
          common.uInt160ToString(from),
          common.uInt160ToString(to),
        ]),
        voteUpdates: voteUpdates.map(([address, votes]) => [
          crypto.scriptHashToAddress({
            addressVersion: context.addressVersion,
            scriptHash: address,
          }),
          votes.map(vote => common.ecPointToString(vote)),
        ]),
        actions: actions.map(action => action.serializeJSON(context)),
      };

      if (dataJSON.asset == null) {
        delete dataJSON.asset;
      }
    }

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
      data: dataJSON,
    };
    if (json.data == null) {
      delete json.data;
    }

    return json;
  }

  // eslint-disable-next-line
  getSystemFee(context: FeeContext): BN {
    return this.gas;
  }

  async verify(options: TransactionVerifyOptions): Promise<void> {
    if (!this.gas.mod(utils.ONE_HUNDRED_MILLION).eq(utils.ZERO)) {
      throw new VerifyError('Invalid GAS amount');
    }

    await super.verify(options);
  }
}
