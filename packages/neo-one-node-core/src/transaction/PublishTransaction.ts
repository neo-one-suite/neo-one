import {
  BinaryWriter,
  InvalidFormatError,
  IOHelper,
  PublishTransactionJSON,
  TransactionBaseModel,
} from '@neo-one/client-common';
import { serializeContractWireBase } from '@neo-one/client-full-common';
import { Constructor } from '@neo-one/utils';
import { Contract, deserializeContractWireBase, sizeOfContract } from '../Contract';
import { VerifyError } from '../errors';
import { DeserializeWireBaseOptions, SerializeJSONContext } from '../Serializable';
import { utils } from '../utils';
import { VerifyScriptResult } from '../vm';
import { Witness } from '../Witness';
import { Attribute } from './attribute';
import { Input } from './Input';
import { Output } from './Output';
import { TransactionBase, TransactionBaseAdd, TransactionVerifyOptions } from './TransactionBase';
import { TransactionType } from './TransactionType';

export interface PublishTransactionAdd extends TransactionBaseAdd {
  readonly contract: Contract;
}

export class PublishTransaction extends TransactionBase<
  TransactionType.Publish,
  PublishTransactionJSON,
  Constructor<TransactionBaseModel<TransactionType.Publish, Attribute, Input, Output, Witness>>
  // tslint:disable-next-line no-any
>(TransactionBaseModel as any) {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): PublishTransaction {
    const { type, version } = super.deserializeTransactionBaseStartWireBase(options);

    if (type !== TransactionType.Publish) {
      throw new InvalidFormatError();
    }

    const contract = deserializeContractWireBase({
      ...options,
      publishVersion: version,
    });

    const { attributes, inputs, outputs, scripts } = super.deserializeTransactionBaseEndWireBase(options);

    return new this({
      version,
      attributes,
      inputs,
      outputs,
      scripts,
      contract,
    });
  }

  public readonly contract: Contract;
  protected readonly sizeExclusive: () => number = utils.lazy(
    () =>
      IOHelper.sizeOfUInt8 +
      sizeOfContract({
        script: this.contract.script,
        parameterList: this.contract.parameterList,
        name: this.contract.name,
        codeVersion: this.contract.codeVersion,
        author: this.contract.author,
        email: this.contract.email,
        description: this.contract.description,
        publishVersion: this.version,
      }),
  );

  public constructor({ version, attributes, inputs, outputs, scripts, hash, contract }: PublishTransactionAdd) {
    super({
      version,
      type: TransactionType.Publish,
      attributes,
      inputs,
      outputs,
      scripts,
      hash,
    });

    this.contract = contract;

    if (this.version > 1) {
      throw new InvalidFormatError();
    }
  }

  public clone({
    scripts = this.scripts,
    attributes = this.attributes,
    inputs = this.inputs,
    outputs = this.outputs,
  }: {
    readonly scripts?: ReadonlyArray<Witness>;
    readonly attributes?: ReadonlyArray<Attribute>;
    readonly inputs?: ReadonlyArray<Input>;
    readonly outputs?: ReadonlyArray<Output>;
  }): this {
    // tslint:disable-next-line no-any
    return new (this.constructor as any)({
      version: this.version,
      attributes,
      inputs,
      outputs,
      scripts,
      contract: this.contract,
    });
  }

  public serializeExclusiveBase(writer: BinaryWriter): void {
    serializeContractWireBase({
      contract: this.contract,
      writer,
      publishVersion: this.version,
    });
  }

  public async serializeJSON(context: SerializeJSONContext): Promise<PublishTransactionJSON> {
    const transactionBaseJSON = await super.serializeTransactionBaseJSON(context);

    return {
      ...transactionBaseJSON,
      type: 'PublishTransaction',
      contract: this.contract.serializeJSON(context),
    };
  }

  public async verify(_options: TransactionVerifyOptions): Promise<ReadonlyArray<VerifyScriptResult>> {
    throw new VerifyError('Publish transactions are obsolete');
  }
}
