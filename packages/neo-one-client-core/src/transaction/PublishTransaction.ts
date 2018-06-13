import {
  Contract,
  ContractJSON,
  deserializeContractWireBase,
  serializeContractWireBase,
  sizeOfContract,
} from '../Contract';
import { InvalidFormatError, VerifyError } from '../errors';
import {
  DeserializeWireBaseOptions,
  SerializeJSONContext,
} from '../Serializable';
import { BinaryWriter, IOHelper, utils } from '../utils';
import { Witness } from '../Witness';
import { Attribute } from './attribute';
import {
  TransactionBase,
  TransactionBaseAdd,
  TransactionBaseJSON,
  TransactionVerifyOptions,
} from './TransactionBase';
import { TransactionType } from './TransactionType';

export interface PublishTransactionAdd extends TransactionBaseAdd {
  contract: Contract;
}

export interface PublishTransactionJSON extends TransactionBaseJSON {
  type: 'PublishTransaction';
  contract: ContractJSON;
}

export class PublishTransaction extends TransactionBase<
  TransactionType.Publish,
  PublishTransactionJSON
> {
  public static deserializeWireBase(
    options: DeserializeWireBaseOptions,
  ): PublishTransaction {
    const { type, version } = super.deserializeTransactionBaseStartWireBase(
      options,
    );

    if (type !== TransactionType.Publish) {
      throw new InvalidFormatError();
    }

    const contract = deserializeContractWireBase({
      ...options,
      publishVersion: version,
    });

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
      contract,
    });
  }

  public readonly contract: Contract;
  protected readonly sizeExclusive: () => number = utils.lazy(
    () =>
      super.size +
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

  constructor({
    version,
    attributes,
    inputs,
    outputs,
    scripts,
    hash,
    contract,
  }: PublishTransactionAdd) {
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
    scripts,
    attributes,
  }: {
    scripts?: Witness[];
    attributes?: Attribute[];
  }): PublishTransaction {
    return new PublishTransaction({
      version: this.version,
      attributes: attributes || this.attributes,
      inputs: this.inputs,
      outputs: this.outputs,
      scripts: scripts || this.scripts,
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

  public async serializeJSON(
    context: SerializeJSONContext,
  ): Promise<PublishTransactionJSON> {
    const transactionBaseJSON = await super.serializeTransactionBaseJSON(
      context,
    );

    return {
      ...transactionBaseJSON,
      type: 'PublishTransaction',
      contract: this.contract.serializeJSON(context),
    };
  }

  public async verify(options: TransactionVerifyOptions): Promise<void> {
    throw new VerifyError('Enrollment transactions are obsolete');
  }
}
