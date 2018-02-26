/* @flow */
import type BN from 'bn.js';

import type { AssetNameJSON } from '../Asset';
import { type Attribute } from './attribute';
import {
  ASSET_TYPE,
  type AssetType,
  type AssetTypeJSON,
  assertAssetType,
  toJSONAssetType,
} from '../AssetType';
import { TRANSACTION_TYPE } from './TransactionType';
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

import common, { type ECPoint, type UInt160, type UInt160Hex } from '../common';
import crypto from '../crypto';
import utils, { type BinaryWriter, IOHelper, JSONHelper } from '../utils';

type Asset = {|
  +type: AssetType,
  +name: string,
  +amount: BN,
  +precision: number,
  +owner: ECPoint,
  +admin: UInt160,
|};

export type RegisterTransactionAdd = {|
  ...TransactionBaseAdd,
  asset: Asset,
|};

export type RegisterTransactionJSON = {|
  ...TransactionBaseJSON,
  type: 'RegisterTransaction',
  asset: {|
    type: AssetTypeJSON,
    name: AssetNameJSON,
    amount: string,
    precision: number,
    owner: string,
    admin: string,
  |},
|};

export default class RegisterTransaction extends TransactionBase<
  typeof TRANSACTION_TYPE.REGISTER,
  RegisterTransactionJSON,
> {
  asset: Asset;

  __size: () => number;
  __registerGetScriptHashesForVerifying: (
    options: TransactionGetScriptHashesForVerifyingOptions,
  ) => Promise<Set<UInt160Hex>>;

  constructor({
    version,
    attributes,
    inputs,
    outputs,
    scripts,
    hash,
    asset,
  }: RegisterTransactionAdd) {
    super({
      version,
      type: TRANSACTION_TYPE.REGISTER,
      attributes,
      inputs,
      outputs,
      scripts,
      hash,
    });
    this.asset = asset;

    if (this.version !== 0) {
      throw new InvalidFormatError();
    }

    if (
      common.ecPointIsInfinity(asset.owner) &&
      asset.type !== ASSET_TYPE.GOVERNING_TOKEN &&
      asset.type !== ASSET_TYPE.UTILITY_TOKEN
    ) {
      throw new InvalidFormatError();
    }

    this.__size = utils.lazy(
      () =>
        super.size +
        IOHelper.sizeOfUInt8 +
        IOHelper.sizeOfUInt8 +
        IOHelper.sizeOfVarString(this.asset.name) +
        IOHelper.sizeOfFixed8 +
        IOHelper.sizeOfUInt8 +
        IOHelper.sizeOfECPoint(this.asset.owner) +
        IOHelper.sizeOfUInt160,
    );
    this.__registerGetScriptHashesForVerifying = utils.lazyAsync(
      async (options: TransactionGetScriptHashesForVerifyingOptions) => {
        const hashes = await super.getScriptHashesForVerifying(options);
        const scriptHash = common.uInt160ToHex(
          crypto.getVerificationScriptHash(this.asset.owner),
        );
        return new Set([...hashes, scriptHash]);
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
      hash: this.hash,
      asset: this.asset,
    });
  }

  serializeExclusiveBase(writer: BinaryWriter): void {
    writer.writeUInt8(this.asset.type);
    writer.writeVarString(this.asset.name);
    writer.writeFixed8(this.asset.amount);
    writer.writeUInt8(this.asset.precision);
    writer.writeECPoint(this.asset.owner);
    writer.writeUInt160(this.asset.admin);
  }

  static deserializeWireBase(options: DeserializeWireBaseOptions): this {
    const { reader } = options;

    const { type, version } = super.deserializeTransactionBaseStartWireBase(
      options,
    );
    if (type !== TRANSACTION_TYPE.REGISTER) {
      throw new InvalidFormatError();
    }

    const assetType = assertAssetType(reader.readUInt8());
    const name = reader.readVarString(1024);
    const amount = reader.readFixed8();
    const precision = reader.readUInt8();
    const owner = reader.readECPoint();
    const admin = reader.readUInt160();

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
      asset: {
        type: assetType,
        name,
        amount,
        precision,
        owner,
        admin,
      },
    });
  }

  async serializeJSON(
    context: SerializeJSONContext,
  ): Promise<RegisterTransactionJSON> {
    const transactionBaseJSON = await super.serializeTransactionBaseJSON(
      context,
    );

    let { name } = this.asset;
    try {
      name = JSON.parse(name);
    } catch (error) {
      // ignore errors
    }

    return {
      type: 'RegisterTransaction',
      txid: transactionBaseJSON.txid,
      size: transactionBaseJSON.size,
      version: transactionBaseJSON.version,
      attributes: transactionBaseJSON.attributes,
      vin: transactionBaseJSON.vin,
      vout: transactionBaseJSON.vout,
      scripts: transactionBaseJSON.scripts,
      sys_fee: transactionBaseJSON.sys_fee,
      net_fee: transactionBaseJSON.net_fee,
      asset: {
        type: toJSONAssetType(this.asset.type),
        name,
        amount: JSONHelper.writeFixed8(this.asset.amount),
        precision: this.asset.precision,
        owner: JSONHelper.writeECPoint(this.asset.owner),
        admin: crypto.scriptHashToAddress({
          addressVersion: context.addressVersion,
          scriptHash: this.asset.admin,
        }),
      },
    };
  }

  getSystemFee(context: FeeContext): BN {
    if (
      this.asset.type === ASSET_TYPE.GOVERNING_TOKEN ||
      this.asset.type === ASSET_TYPE.UTILITY_TOKEN
    ) {
      return utils.ZERO;
    }

    return super.getSystemFee(context);
  }

  async getScriptHashesForVerifying(
    options: TransactionGetScriptHashesForVerifyingOptions,
  ): Promise<Set<UInt160Hex>> {
    return this.__registerGetScriptHashesForVerifying(options);
  }

  // eslint-disable-next-line
  async verify(options: TransactionVerifyOptions): Promise<void> {
    throw new VerifyError('Enrollment transactions are obsolete');
  }
}
