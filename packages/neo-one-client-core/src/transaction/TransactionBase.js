/* @flow */
import type BN from 'bn.js';

import _ from 'lodash';
import { utils as commonUtils } from '@neo-one/utils';

import {
  ATTRIBUTE_USAGE,
  type Attribute,
  type AttributeJSON,
  UInt160Attribute,
  deserializeWireBase as deserializeAttributeWireBase,
} from './attribute';
import { ASSET_TYPE, hasFlag } from '../AssetType';
import type Account, { AccountKey } from '../Account';
import { SCRIPT_CONTAINER_TYPE } from '../ScriptContainer';
import {
  TRANSACTION_TYPE,
  type TransactionType,
  assertTransactionType,
} from './TransactionType';
import type Asset, { AssetKey } from '../Asset';
import { type Equatable, type Equals } from '../Equatable';
import {
  type DeserializeWireBaseOptions,
  type DeserializeWireOptions,
  type SerializableJSON,
  type SerializeJSONContext,
  type SerializeWire,
  type SerializableWire,
  createSerializeWire,
} from '../Serializable';
import { InvalidFormatError, VerifyError } from '../errors';
import Input, { type InputJSON } from './Input';
import Output, { type OutputJSON, type OutputKey } from './Output';
import type RegisterTransaction from './RegisterTransaction';
import type { Transaction } from './Transaction';
import type { VerifyScript } from '../vm';
import type Validator from '../Validator';
import Witness, { type WitnessJSON } from '../Witness';

import common, {
  type ECPoint,
  type PrivateKey,
  type UInt160Hex,
  type UInt256,
  type UInt256Hex,
} from '../common';
import crypto from '../crypto';
import { hasDuplicateInputs } from './common';
import utils, {
  BinaryReader,
  type BinaryWriter,
  IOHelper,
  JSONHelper,
} from '../utils';

const getUtilityValue = ({
  outputs,
  utilityToken,
}: {|
  outputs: Array<Output>,
  utilityToken: RegisterTransaction,
|}) =>
  outputs
    .filter(output => common.uInt256Equal(output.asset, utilityToken.hash))
    .reduce((acc, output) => acc.add(output.value), utils.ZERO);

export type FeeContext = {|
  getOutput: (input: Input) => Promise<Output>,
  governingToken: RegisterTransaction,
  utilityToken: RegisterTransaction,
  fees: { [type: TransactionType]: BN },
  registerValidatorFee: BN,
|};
export type TransactionGetScriptHashesForVerifyingOptions = {|
  getOutput: (key: OutputKey) => Promise<Output>,
  getAsset: (key: AssetKey) => Promise<Asset>,
|};
export type GetReferencesOptions = {|
  getOutput: (key: OutputKey) => Promise<Output>,
|};
export type GetTransactionResultsOptions = {|
  getOutput: (key: OutputKey) => Promise<Output>,
|};
export type TransactionVerifyOptions = {|
  calculateClaimAmount: (inputs: Array<Input>) => Promise<BN>,
  isSpent: (key: OutputKey) => Promise<boolean>,
  getAsset: (key: AssetKey) => Promise<Asset>,
  getOutput: (key: OutputKey) => Promise<Output>,
  tryGetAccount: (key: AccountKey) => Promise<?Account>,
  standbyValidators: Array<ECPoint>,
  getAllValidators: () => Promise<Array<Validator>>,
  verifyScript: VerifyScript,
  currentHeight: number,
  governingToken: RegisterTransaction,
  utilityToken: RegisterTransaction,
  fees: { [type: TransactionType]: BN },
  registerValidatorFee: BN,
  memPool?: Array<Transaction>,
|};
export type TransactionBaseAdd = {|
  version?: number,
  attributes?: Array<Attribute>,
  inputs?: Array<Input>,
  outputs?: Array<Output>,
  scripts?: Array<Witness>,
  hash?: UInt256,
|};
export type TransactionBaseAddWithType<Type: TransactionType> = {|
  ...TransactionBaseAdd,
  type: Type,
|};

export type TransactionBaseJSON = {|
  txid: string,
  size: number,
  version: number,
  attributes: Array<AttributeJSON>,
  vin: Array<InputJSON>,
  vout: Array<OutputJSON>,
  scripts: Array<WitnessJSON>,
  sys_fee: string,
  net_fee: string,
|};

export const MAX_TRANSACTION_ATTRIBUTES = 16;

export default class TransactionBase<Type: TransactionType, TransactionJSON>
  implements
    Equatable,
    SerializableWire<Transaction>,
    SerializableJSON<TransactionJSON> {
  static VERSION = 0;

  type: Type;
  version: number;
  attributes: Array<Attribute>;
  inputs: Array<Input>;
  outputs: Array<Output>;
  scripts: Array<Witness>;

  _hash: () => UInt256;
  _message: () => Buffer;

  constructor({
    version,
    type,
    attributes,
    inputs,
    outputs,
    scripts,
    hash,
  }: TransactionBaseAddWithType<Type>) {
    this.version = version == null ? this.constructor.VERSION : version;
    this.type = type;
    this.attributes = attributes || [];
    this.inputs = inputs || [];
    this.outputs = outputs || [];
    this.scripts = scripts || [];
    const hashIn = hash;
    this._hash =
      hashIn == null
        ? utils.lazy(() => crypto.hash256(this.message))
        : () => hashIn;

    if (this.attributes.length > MAX_TRANSACTION_ATTRIBUTES) {
      throw new InvalidFormatError();
    }
  }

  _hashHex = utils.lazy(() => common.uInt256ToHex(this.hash));
  _size = utils.lazy(
    () =>
      IOHelper.sizeOfUInt8 +
      IOHelper.sizeOfArray(this.attributes, attribute => attribute.size) +
      IOHelper.sizeOfArray(this.inputs, input => input.size) +
      IOHelper.sizeOfArray(this.outputs, output => output.size) +
      IOHelper.sizeOfArray(this.scripts, script => script.size),
  );
  _message = utils.lazy(() => this.serializeUnsigned());

  get hash(): UInt256 {
    return this._hash();
  }

  get hashHex(): UInt256Hex {
    return this._hashHex();
  }

  get size(): number {
    return this._size();
  }

  get message(): Buffer {
    return this._message();
  }

  // eslint-disable-next-line
  clone(options: {|
    scripts?: Array<Witness>,
    attributes?: Array<Attribute>,
  |}): this {
    throw new Error('Not Implemented');
  }

  sign(key: PrivateKey): this {
    return this.clone({
      scripts: this.scripts.concat([
        crypto.createWitness(this.serializeUnsigned(), key),
      ]),
    });
  }

  signWithSignature(signature: Buffer, publicKey: ECPoint): this {
    return this.clone({
      scripts: this.scripts.concat([
        crypto.createWitnessForSignature(signature, publicKey),
      ]),
    });
  }

  equals: Equals = utils.equals(this.constructor, other =>
    common.uInt256Equal(this.hash, other.hash),
  );

  // eslint-disable-next-line
  serializeExclusiveBase(writer: BinaryWriter): void {}

  serializeUnsignedBase(writer: BinaryWriter): void {
    writer.writeUInt8(this.type);
    writer.writeUInt8(this.version);
    this.serializeExclusiveBase(writer);
    writer.writeArray(this.attributes, attribute => {
      attribute.serializeWireBase(writer);
    });
    writer.writeArray(this.inputs, input => {
      input.serializeWireBase(writer);
    });
    writer.writeArray(this.outputs, output => {
      output.serializeWireBase(writer);
    });
  }

  serializeWireBase(writer: BinaryWriter): void {
    this.serializeUnsignedBase(writer);
    writer.writeArray(this.scripts, script => {
      script.serializeWireBase(writer);
    });
  }

  serializeWire: SerializeWire = createSerializeWire(
    this.serializeWireBase.bind(this),
  );

  serializeUnsigned: SerializeWire = createSerializeWire(
    this.serializeUnsignedBase.bind(this),
  );

  static deserializeTransactionBaseStartWireBase({
    reader,
  }: DeserializeWireBaseOptions): {| type: TransactionType, version: number |} {
    const type = assertTransactionType(reader.readUInt8());
    const version = reader.readUInt8();

    return { type, version };
  }

  static deserializeTransactionBaseEndWireBase(
    options: DeserializeWireBaseOptions,
  ): {|
    attributes: Array<Attribute>,
    inputs: Array<Input>,
    outputs: Array<Output>,
    scripts: Array<Witness>,
  |} {
    const { reader } = options;
    const attributes = reader.readArray(
      () => deserializeAttributeWireBase(options),
      MAX_TRANSACTION_ATTRIBUTES,
    );
    const inputs = reader.readArray(() => Input.deserializeWireBase(options));
    const outputs = reader.readArray(
      () => Output.deserializeWireBase(options),
      utils.USHORT_MAX_NUMBER + 1,
    );
    const scripts = reader.readArray(() =>
      Witness.deserializeWireBase(options),
    );

    return { attributes, inputs, outputs, scripts };
  }

  // eslint-disable-next-line
  static deserializeWireBase(options: DeserializeWireBaseOptions): this {
    throw new Error('Not Implemented');
  }

  static deserializeWire(options: DeserializeWireOptions): this {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  async serializeTransactionBaseJSON(
    context: SerializeJSONContext,
  ): Promise<TransactionBaseJSON> {
    const networkFee = await this.getNetworkFee(context.feeContext);
    return {
      txid: common.uInt256ToString(this.hashHex),
      size: this.size,
      version: this.version,
      attributes: this.attributes.map(attribute =>
        attribute.serializeJSON(context),
      ),
      vin: this.inputs.map(input => input.serializeJSON(context)),
      vout: this.outputs.map((output, index) =>
        output.serializeJSON(context, index),
      ),
      scripts: this.scripts.map(script => script.serializeJSON(context)),
      sys_fee: JSONHelper.writeFixed8(this.getSystemFee(context.feeContext)),
      net_fee: JSONHelper.writeFixed8(networkFee),
    };
  }

  // eslint-disable-next-line
  async serializeJSON(context: SerializeJSONContext): Promise<TransactionJSON> {
    throw new Error('Not Implemented');
  }

  _networkFee = utils.lazyAsync(async (context: FeeContext): Promise<BN> => {
    const { getOutput, utilityToken } = context;

    const outputsForInputs = await Promise.all(
      this.inputs.map(input => getOutput(input)),
    );
    const inputValue = getUtilityValue({
      outputs: outputsForInputs,
      utilityToken,
    });
    const outputValue = getUtilityValue({
      outputs: this.outputs,
      utilityToken,
    });
    return inputValue.sub(outputValue).sub(this.getSystemFee(context));
  });

  async getNetworkFee(context: FeeContext): Promise<BN> {
    return this._networkFee(context);
  }

  getSystemFee({ fees }: FeeContext): BN {
    return fees[this.type] || utils.ZERO;
  }

  __getReferences = utils.lazyAsync(
    async ({ getOutput }: GetReferencesOptions) =>
      Promise.all(this.inputs.map(input => getOutput(input))),
  );

  getReferences(options: GetReferencesOptions): Promise<Array<Output>> {
    return this.__getReferences(options);
  }

  __getTransactionResults = utils.lazyAsync(
    async ({
      getOutput,
    }: GetTransactionResultsOptions): Promise<{ [asset: UInt256Hex]: BN }> => {
      const inputOutputs = await this.getReferences({ getOutput });
      const results = ({}: { [asset: UInt256Hex]: BN });
      const addOutputs = (outputs: Array<Output>, negative?: boolean) => {
        for (const output of outputs) {
          const key = common.uInt256ToHex(output.asset);
          if (results[key] == null) {
            results[key] = utils.ZERO;
          }

          results[key] = results[key].add(
            negative ? output.value.neg() : output.value,
          );
        }
      };
      addOutputs(inputOutputs);
      addOutputs(this.outputs, true);

      return _.pickBy(results, value => !value.eq(utils.ZERO));
    },
  );

  getTransactionResults(
    options: GetTransactionResultsOptions,
  ): Promise<{ [asset: UInt256Hex]: BN }> {
    return this.__getTransactionResults(options);
  }

  __baseGetScriptHashesForVerifying = utils.lazyAsync(
    async ({
      getOutput,
      getAsset,
    }: TransactionGetScriptHashesForVerifyingOptions) => {
      const [inputHashes, outputHashes] = await Promise.all([
        Promise.all(
          this.inputs.map(async input => {
            const output = await getOutput(input);
            return common.uInt160ToHex(output.address);
          }),
        ),
        Promise.all(
          this.outputs.map(async output => {
            const asset = await getAsset({ hash: output.asset });
            if (hasFlag(asset.type, ASSET_TYPE.DUTY_FLAG)) {
              return common.uInt160ToHex(output.address);
            }

            return null;
          }),
        ).then(hashes => hashes.filter(Boolean)),
      ]);
      const attributeHashes = this.attributes
        .map(
          attribute =>
            attribute instanceof UInt160Attribute &&
            attribute.usage === ATTRIBUTE_USAGE.SCRIPT
              ? common.uInt160ToHex(attribute.value)
              : null,
        )
        .filter(Boolean);

      return new Set([...inputHashes, ...outputHashes, ...attributeHashes]);
    },
  );

  async getScriptHashesForVerifying(
    options: TransactionGetScriptHashesForVerifyingOptions,
  ): Promise<Set<UInt160Hex>> {
    return this.__baseGetScriptHashesForVerifying(options);
  }

  async verify(options: TransactionVerifyOptions): Promise<void> {
    const { memPool = [] } = options;
    if (hasDuplicateInputs(this.inputs)) {
      throw new VerifyError('Duplicate inputs');
    }

    if (
      memPool.some(
        tx =>
          !tx.equals(this) &&
          tx.inputs.some(input =>
            this.inputs.some(thisInput => input.equals(thisInput)),
          ),
      )
    ) {
      throw new VerifyError('Input already exists in mempool');
    }

    if (
      this.attributes.filter(
        attribute =>
          attribute.usage === ATTRIBUTE_USAGE.ECDH02 ||
          attribute.usage === ATTRIBUTE_USAGE.ECDH03,
      ).length > 1
    ) {
      throw new VerifyError('Too many ECDH attributes.');
    }

    await Promise.all([
      this._verifyDoubleSpend(options),
      this._verifyOutputs(options),
      this._verifyTransactionResults(options),
      this._verifyScripts(options),
    ]);
  }

  async _verifyDoubleSpend({
    isSpent,
  }: TransactionVerifyOptions): Promise<void> {
    const isDoubleSpend = await Promise.all(
      this.inputs.map(input => isSpent(input)),
    );
    if (isDoubleSpend.some(value => value)) {
      throw new VerifyError('Transaction is a double spend');
    }
  }

  async _verifyOutputs({
    getAsset,
    currentHeight,
  }: TransactionVerifyOptions): Promise<void> {
    const outputsGrouped = commonUtils.entries(
      _.groupBy(this.outputs, output => common.uInt256ToHex(output.asset)),
    );
    const hasInvalidOutputs = await Promise.all(
      outputsGrouped.map(async ([assetHex, outputs]) => {
        const asset = await getAsset({ hash: common.hexToUInt256(assetHex) });
        if (
          asset.expiration <= currentHeight + 1 &&
          asset.type !== ASSET_TYPE.GOVERNING_TOKEN &&
          asset.type !== ASSET_TYPE.UTILITY_TOKEN
        ) {
          return true;
        }

        return outputs.some(
          output =>
            !output.value
              .mod(utils.TEN.pow(utils.EIGHT.subn(asset.precision)))
              .eq(utils.ZERO),
        );
      }),
    );
    if (hasInvalidOutputs.some(value => value)) {
      throw new VerifyError('Transaction has invalid output');
    }
  }

  async _verifyTransactionResults({
    getOutput,
    utilityToken,
    governingToken,
    fees,
    registerValidatorFee,
  }: TransactionVerifyOptions): Promise<void> {
    const results = await this.getTransactionResults({ getOutput });
    const resultsDestroy = commonUtils.entries(results).filter(
      // eslint-disable-next-line
      ([_, value]) => value.gt(utils.ZERO),
    );
    if (
      resultsDestroy.length > 1 ||
      (resultsDestroy.length === 1 &&
        !common.uInt256Equal(
          common.hexToUInt256(resultsDestroy[0][0]),
          utilityToken.hash,
        ))
    ) {
      throw new VerifyError('Invalid destroyed output.');
    }

    const feeContext = {
      getOutput,
      governingToken,
      utilityToken,
      fees,
      registerValidatorFee,
    };
    const systemFee = this.getSystemFee(feeContext);
    if (
      systemFee.gt(utils.ZERO) &&
      (resultsDestroy.length === 0 || resultsDestroy[0][1].lt(systemFee))
    ) {
      throw new VerifyError('Not enough output value for system fee.');
    }

    const resultsIssue = commonUtils.entries(results).filter(
      // eslint-disable-next-line
      ([_, value]) => value.lt(utils.ZERO),
    );

    switch (this.type) {
      case TRANSACTION_TYPE.MINER:
      case TRANSACTION_TYPE.CLAIM:
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
          throw new VerifyError('Invalid miner/claim result');
        }
        break;
      case TRANSACTION_TYPE.ISSUE:
        if (
          // eslint-disable-next-line
          resultsIssue.some(([assetHex, _]) =>
            common.uInt256Equal(
              common.hexToUInt256(assetHex),
              utilityToken.hash,
            ),
          )
        ) {
          throw new VerifyError('Invalid issue result');
        }
        break;
      default:
        if (resultsIssue.length > 0) {
          throw new VerifyError('Invalid results.');
        }
        break;
    }
  }

  async _verifyScripts({
    getAsset,
    getOutput,
    verifyScript,
  }: TransactionVerifyOptions): Promise<void> {
    const hashesSet = await this.getScriptHashesForVerifying({
      getAsset,
      getOutput,
    });

    if (hashesSet.size !== this.scripts.length) {
      throw new VerifyError('Invalid witnesses');
    }

    const hashes = [...hashesSet]
      .sort()
      .map(value => common.hexToUInt160(value));
    await Promise.all(
      _.zip(hashes, this.scripts).map(([hash, witness]) =>
        verifyScript({
          scriptContainer: {
            type: SCRIPT_CONTAINER_TYPE.TRANSACTION,
            value: (this: $FlowFixMe),
          },
          hash,
          witness,
        }),
      ),
    );
  }
}
