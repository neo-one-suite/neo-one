import { utils as commonUtils } from '@neo-one/utils';
import { BN } from 'bn.js';
import { BinaryWriter } from '../../BinaryWriter';
import { common, InvalidFormatError } from '../../common';
import { addressToScriptHash } from '../../helpers';
import { Asset, Input, Output } from '../../types';
import { utils } from '../../utils';
import { WitnessModel } from '../WitnessModel';
import { AttributeModel, AttributeUsageModel, UInt160AttributeModel } from './attribute';
import { InputModel } from './InputModel';
import { OutputModel } from './OutputModel';
import { TransactionBaseModel, TransactionBaseModelAdd } from './TransactionBaseModel';
import { TransactionTypeModel } from './TransactionTypeModel';

export interface TransactionGetScriptHashesForVerifyingOptions {
  readonly getOutput: (input: Input) => Promise<Output>;
  readonly getAsset: (hash: string) => Promise<Asset>;
}

export interface InvocationTransactionModelAdd<
  TAttribute extends AttributeModel = AttributeModel,
  TInput extends InputModel = InputModel,
  TOutput extends OutputModel = OutputModel,
  TWitness extends WitnessModel = WitnessModel
> extends TransactionBaseModelAdd<TAttribute, TInput, TOutput, TWitness> {
  readonly gas: BN;
  readonly script: Buffer;
}

export class InvocationTransactionModel<
  TAttribute extends AttributeModel = AttributeModel,
  TInput extends InputModel = InputModel,
  TOutput extends OutputModel = OutputModel,
  TWitness extends WitnessModel = WitnessModel
> extends TransactionBaseModel<TransactionTypeModel.Invocation, TAttribute, TInput, TOutput, TWitness> {
  public static readonly VERSION = 1;
  public readonly gas: BN;
  public readonly script: Buffer;

  public constructor({
    version,
    attributes,
    inputs,
    outputs,
    scripts,
    hash,
    gas,
    script,
  }: InvocationTransactionModelAdd<TAttribute, TInput, TOutput, TWitness>) {
    super({
      version,
      type: TransactionTypeModel.Invocation,
      attributes,
      inputs,
      outputs,
      scripts,
      hash,
    });

    this.gas = gas;
    this.script = script;

    if (this.version > 1) {
      throw new InvalidFormatError(`expected version <= 1, found: ${this.version}`);
    }

    if (this.script.length === 0) {
      throw new InvalidFormatError('expected script');
    }

    if (this.gas.lt(utils.ZERO)) {
      throw new InvalidFormatError(`expected valid gas, found: ${this.gas.toString()}`);
    }
  }

  public clone({
    scripts = this.scripts,
    attributes = this.attributes,
    inputs = this.inputs,
    outputs = this.outputs,
  }: {
    readonly scripts?: readonly WitnessModel[];
    readonly attributes?: readonly AttributeModel[];
    readonly inputs?: readonly InputModel[];
    readonly outputs?: readonly OutputModel[];
  }): this {
    // tslint:disable-next-line no-any
    return new (this.constructor as any)({
      version: this.version,
      attributes,
      inputs,
      outputs,
      scripts,
      gas: this.gas,
      script: this.script,
    });
  }

  public serializeExclusiveBase(writer: BinaryWriter): void {
    writer.writeVarBytesLE(this.script);
    if (this.version >= 1) {
      writer.writeFixed8(this.gas);
    }
  }

  public async getScriptHashesForVerifying({
    getOutput,
    getAsset,
  }: TransactionGetScriptHashesForVerifyingOptions): Promise<readonly string[]> {
    const [inputHashes, outputHashes] = await Promise.all([
      Promise.all(
        this.inputs.map(async (input) => {
          const output = await getOutput({ hash: common.uInt256ToHex(input.hash), index: input.index });

          return addressToScriptHash(output.address);
        }),
      ),

      Promise.all(
        this.outputs.map(async (output) => {
          const assetHash = common.uInt256ToHex(output.asset);
          if (assetHash === common.NEO_ASSET_HASH || assetHash === common.GAS_ASSET_HASH) {
            return undefined;
          }

          const asset = await getAsset(assetHash);
          if (asset.type === 'Duty') {
            return common.uInt160ToHex(output.address);
          }

          return undefined;
        }),
      ).then((hashes) => hashes.filter(commonUtils.notNull)),
    ]);

    const attributeHashes = this.attributes
      .map((attribute) =>
        attribute instanceof UInt160AttributeModel && attribute.usage === AttributeUsageModel.Script
          ? common.uInt160ToHex(attribute.value)
          : undefined,
      )
      .filter(commonUtils.notNull);

    return [...inputHashes, ...outputHashes, ...attributeHashes];
  }
}
