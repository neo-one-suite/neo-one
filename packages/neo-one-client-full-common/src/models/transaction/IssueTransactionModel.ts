import {
  AttributeModel,
  InputModel,
  OutputModel,
  TransactionBaseModel,
  TransactionBaseModelAdd,
  TransactionTypeModel,
  WitnessModel,
} from '@neo-one/client-common';
import { InvalidVersionError } from '../../errors';

export type IssueTransactionModelAdd<
  TAttribute extends AttributeModel = AttributeModel,
  TInput extends InputModel = InputModel,
  TOutput extends OutputModel = OutputModel,
  TWitness extends WitnessModel = WitnessModel
> = TransactionBaseModelAdd<TAttribute, TInput, TOutput, TWitness>;

export class IssueTransactionModel<
  TAttribute extends AttributeModel = AttributeModel,
  TInput extends InputModel = InputModel,
  TOutput extends OutputModel = OutputModel,
  TWitness extends WitnessModel = WitnessModel
> extends TransactionBaseModel<TransactionTypeModel.Issue, TAttribute, TInput, TOutput, TWitness> {
  public constructor({
    version,
    attributes,
    inputs,
    outputs,
    scripts,
    hash,
  }: IssueTransactionModelAdd<TAttribute, TInput, TOutput, TWitness>) {
    super({
      version,
      type: TransactionTypeModel.Issue,
      attributes,
      inputs,
      outputs,
      scripts,
      hash,
    });

    if (this.version !== 0) {
      throw new InvalidVersionError(0, this.version);
    }
  }

  public clone({
    scripts = this.scripts,
    attributes = this.attributes,
    inputs = this.inputs,
    outputs = this.outputs,
  }: {
    readonly scripts?: readonly TWitness[];
    readonly attributes?: readonly TAttribute[];
    readonly inputs?: readonly TInput[];
    readonly outputs?: readonly TOutput[];
  }): this {
    // tslint:disable-next-line no-any
    return new (this.constructor as any)({
      version: this.version,
      attributes,
      inputs,
      outputs,
      scripts,
    });
  }
}
