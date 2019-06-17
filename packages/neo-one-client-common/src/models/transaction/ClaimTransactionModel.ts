import { BinaryWriter } from '../../BinaryWriter';
import { InvalidFormatError } from '../../common';
import { WitnessModel } from '../WitnessModel';
import { AttributeModel } from './attribute';
import { InputModel } from './InputModel';
import { OutputModel } from './OutputModel';
import { TransactionBaseModel, TransactionBaseModelAdd } from './TransactionBaseModel';
import { TransactionTypeModel } from './TransactionTypeModel';

export interface ClaimTransactionModelAdd<
  TAttribute extends AttributeModel = AttributeModel,
  TInput extends InputModel = InputModel,
  TOutput extends OutputModel = OutputModel,
  TWitness extends WitnessModel = WitnessModel
> extends TransactionBaseModelAdd<TAttribute, TInput, TOutput, TWitness> {
  readonly claims: readonly TInput[];
}

export class ClaimTransactionModel<
  TAttribute extends AttributeModel = AttributeModel,
  TInput extends InputModel = InputModel,
  TOutput extends OutputModel = OutputModel,
  TWitness extends WitnessModel = WitnessModel
> extends TransactionBaseModel<TransactionTypeModel.Claim, TAttribute, TInput, TOutput, TWitness> {
  public readonly claims: readonly InputModel[];
  public constructor({
    version,
    attributes,
    inputs,
    outputs,
    scripts,
    hash,
    claims,
  }: ClaimTransactionModelAdd<TAttribute, TInput, TOutput, TWitness>) {
    super({
      version,
      type: TransactionTypeModel.Claim,
      attributes,
      inputs,
      outputs,
      scripts,
      hash,
    });

    this.claims = claims;

    if (this.version !== 0) {
      throw new InvalidFormatError(`expected version 0, found: ${this.version}`);
    }

    if (this.claims.length === 0) {
      throw new InvalidFormatError('expected claims, found none.');
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
      claims: this.claims,
    });
  }

  public serializeExclusiveBase(writer: BinaryWriter): void {
    writer.writeArray(this.claims, (claim) => {
      claim.serializeWireBase(writer);
    });
  }
}
