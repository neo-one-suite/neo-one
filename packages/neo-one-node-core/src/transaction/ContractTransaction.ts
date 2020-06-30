import { ContractTransactionJSON, InvalidFormatError, IOHelper, TransactionBaseModel } from '@neo-one/client-common';
import { Constructor } from '@neo-one/utils';
import { DeserializeWireBaseOptions, SerializeJSONContext } from '../Serializable';
import { utils } from '../utils';
import { Witness } from '../Witness';
import { Attribute } from './attribute';
import { Input } from './Input';
import { Output } from './Output';
import { TransactionBase, TransactionBaseAdd } from './TransactionBase';
import { TransactionType } from './TransactionType';

export type ContractTransactionAdd = TransactionBaseAdd;

export class ContractTransaction extends TransactionBase<
  TransactionType.Contract,
  ContractTransactionJSON,
  Constructor<TransactionBaseModel<TransactionType.Contract, Attribute, Input, Output, Witness>>
  // tslint:disable-next-line no-any
>(TransactionBaseModel as any) {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): ContractTransaction {
    const { type, version } = super.deserializeTransactionBaseStartWireBase(options);

    if (type !== TransactionType.Contract) {
      throw new InvalidFormatError(`Expected transaction type to be ${TransactionType.Contract}. Received: ${type}`);
    }

    const { attributes, inputs, outputs, scripts } = super.deserializeTransactionBaseEndWireBase(options);

    return new this({
      version,
      attributes,
      inputs,
      outputs,
      scripts,
    });
  }

  public readonly sizeExclusive: () => number = utils.lazy(() => IOHelper.sizeOfUInt8);

  public constructor({ version, attributes, inputs, outputs, scripts, hash }: TransactionBaseAdd) {
    super({
      version,
      type: TransactionType.Contract,
      attributes,
      inputs,
      outputs,
      scripts,
      hash,
    });

    if (this.version !== 0) {
      throw new InvalidFormatError(`Expected version to be 0. Received: ${this.version}`);
    }
  }

  public clone({
    scripts = this.scripts,
    attributes = this.attributes,
    inputs = this.inputs,
    outputs = this.outputs,
  }: {
    readonly scripts?: readonly Witness[];
    readonly attributes?: readonly Attribute[];
    readonly inputs?: readonly Input[];
    readonly outputs?: readonly Output[];
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

  public async serializeJSON(context: SerializeJSONContext): Promise<ContractTransactionJSON> {
    const transactionBaseJSON = await super.serializeTransactionBaseJSON(context);

    return {
      ...transactionBaseJSON,
      type: 'ContractTransaction',
    };
  }
}
