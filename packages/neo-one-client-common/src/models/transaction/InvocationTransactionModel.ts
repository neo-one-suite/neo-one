import BN from 'bn.js';
import { BinaryWriter } from '../../BinaryWriter';
import { InvalidFormatError } from '../../common';
import { utils } from '../../utils';
import { WitnessModel } from '../WitnessModel';
import { AttributeModel } from './attribute';
import { InputModel } from './InputModel';
import { OutputModel } from './OutputModel';
import { TransactionBaseModel, TransactionBaseModelAdd } from './TransactionBaseModel';
import { TransactionTypeModel } from './TransactionTypeModel';

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
      throw new InvalidFormatError();
    }

    if (this.script.length === 0) {
      throw new InvalidFormatError();
    }

    if (this.gas.lt(utils.ZERO)) {
      throw new InvalidFormatError();
    }
  }

  public clone({
    scripts = this.scripts,
    attributes = this.attributes,
    inputs = this.inputs,
    outputs = this.outputs,
  }: {
    readonly scripts?: ReadonlyArray<WitnessModel>;
    readonly attributes?: ReadonlyArray<AttributeModel>;
    readonly inputs?: ReadonlyArray<InputModel>;
    readonly outputs?: ReadonlyArray<OutputModel>;
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
}
