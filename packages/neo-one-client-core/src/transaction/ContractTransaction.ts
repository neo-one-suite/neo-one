import { InvalidFormatError } from '../errors';
import {
  DeserializeWireBaseOptions,
  SerializeJSONContext,
} from '../Serializable';
import { IOHelper, utils } from '../utils';
import { Witness } from '../Witness';
import { Attribute } from './attribute';
import {
  TransactionBase,
  TransactionBaseAdd,
  TransactionBaseJSON,
} from './TransactionBase';
import { TransactionType } from './TransactionType';

export type ContractTransactionAdd = TransactionBaseAdd;

export interface ContractTransactionJSON extends TransactionBaseJSON {
  type: 'ContractTransaction';
}

export class ContractTransaction extends TransactionBase<
  TransactionType.Contract,
  ContractTransactionJSON
> {
  public static deserializeWireBase(
    options: DeserializeWireBaseOptions,
  ): ContractTransaction {
    const { type, version } = super.deserializeTransactionBaseStartWireBase(
      options,
    );

    if (type !== TransactionType.Contract) {
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

  protected readonly sizeExclusive: () => number = utils.lazy(
    () => IOHelper.sizeOfUInt8,
  );

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
      type: TransactionType.Contract,
      attributes,
      inputs,
      outputs,
      scripts,
      hash,
    });

    if (this.version !== 0) {
      throw new InvalidFormatError();
    }
  }

  public clone({
    scripts,
    attributes,
  }: {
    scripts?: Witness[];
    attributes?: Attribute[];
  }): ContractTransaction {
    return new ContractTransaction({
      version: this.version,
      attributes: attributes || this.attributes,
      inputs: this.inputs,
      outputs: this.outputs,
      scripts: scripts || this.scripts,
    });
  }

  public async serializeJSON(
    context: SerializeJSONContext,
  ): Promise<ContractTransactionJSON> {
    const transactionBaseJSON = await super.serializeTransactionBaseJSON(
      context,
    );

    return {
      ...transactionBaseJSON,
      type: 'ContractTransaction',
    };
  }
}
