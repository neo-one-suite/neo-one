import {
  BinaryWriter,
  InvalidFormatError,
  IOHelper,
  StateTransactionJSON,
  TransactionBaseModel,
  UInt160Hex,
} from '@neo-one/client-common';
import { Constructor } from '@neo-one/utils';
import { BN } from 'bn.js';
import { DeserializeWireBaseOptions, SerializeJSONContext } from '../Serializable';
import { utils } from '../utils';
import { VerifyScriptResult } from '../vm';
import { Witness } from '../Witness';
import { Attribute } from './attribute';
import { Input } from './Input';
import { Output } from './Output';
import { StateDescriptor } from './state';
import {
  FeeContext,
  TransactionBase,
  TransactionBaseAdd,
  TransactionGetScriptHashesForVerifyingOptions,
  TransactionVerifyOptions,
} from './TransactionBase';
import { TransactionType } from './TransactionType';

export interface StateTransactionAdd extends TransactionBaseAdd {
  readonly descriptors: readonly StateDescriptor[];
}

export class StateTransaction extends TransactionBase<
  TransactionType.State,
  StateTransactionJSON,
  Constructor<TransactionBaseModel<TransactionType.State, Attribute, Input, Output, Witness>>
  // tslint:disable-next-line no-any
>(TransactionBaseModel as any) {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): StateTransaction {
    const { reader } = options;
    const { type, version } = super.deserializeTransactionBaseStartWireBase(options);

    if (type !== TransactionType.State) {
      throw new InvalidFormatError(`Expected transaction type ${TransactionType.State}. Received: ${type}`);
    }

    const descriptors = reader.readArray(() => StateDescriptor.deserializeWireBase(options));

    const { attributes, inputs, outputs, scripts } = super.deserializeTransactionBaseEndWireBase(options);

    return new this({
      version,
      attributes,
      inputs,
      outputs,
      scripts,
      descriptors,
    });
  }

  public readonly descriptors: readonly StateDescriptor[];
  public readonly sizeExclusive: () => number = utils.lazy(() =>
    IOHelper.sizeOfArray(this.descriptors, (descriptor) => descriptor.size),
  );
  private readonly stateGetScriptHashesForVerifyingInternal: (
    options: TransactionGetScriptHashesForVerifyingOptions,
  ) => Promise<Set<UInt160Hex>>;

  public constructor({ version, attributes, inputs, outputs, scripts, hash, descriptors }: StateTransactionAdd) {
    super({
      version,
      type: TransactionType.State,
      attributes,
      inputs,
      outputs,
      scripts,
      hash,
    });

    this.descriptors = descriptors;

    if (this.version !== 0) {
      throw new InvalidFormatError(`Expected version to be 0. Received: ${this.version}`);
    }

    const getScriptHashesForVerifying = super.getScriptHashesForVerifying.bind(this);
    this.stateGetScriptHashesForVerifyingInternal = utils.lazyAsync(
      async (options: TransactionGetScriptHashesForVerifyingOptions) => {
        const mutableHashes = await getScriptHashesForVerifying(options);
        this.descriptors.forEach((descriptor) => {
          descriptor.getScriptHashesForVerifying().forEach((scriptHash) => {
            mutableHashes.add(scriptHash);
          });
        });

        return mutableHashes;
      },
    );
  }

  public getSystemFee(context: FeeContext): BN {
    return this.descriptors.reduce((value, descriptor) => value.add(descriptor.getSystemFee(context)), utils.ZERO);
  }

  public async getScriptHashesForVerifying(
    options: TransactionGetScriptHashesForVerifyingOptions,
  ): Promise<Set<UInt160Hex>> {
    return this.stateGetScriptHashesForVerifyingInternal(options);
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
      descriptors: this.descriptors,
    });
  }

  public serializeExclusiveBase(writer: BinaryWriter): void {
    writer.writeArray(this.descriptors, (descriptor) => {
      descriptor.serializeWireBase(writer);
    });
  }

  public async serializeJSON(context: SerializeJSONContext): Promise<StateTransactionJSON> {
    const transactionBaseJSON = await super.serializeTransactionBaseJSON(context);

    return {
      ...transactionBaseJSON,
      type: 'StateTransaction',
      descriptors: this.descriptors.map((descriptor) => descriptor.serializeJSON(context)),
    };
  }

  public async verify(options: TransactionVerifyOptions): Promise<readonly VerifyScriptResult[]> {
    const [results] = await Promise.all([super.verify(options), this.verifyInternal(options)]);

    return results;
  }

  private async verifyInternal(options: TransactionVerifyOptions): Promise<void> {
    await Promise.all(this.descriptors.map(async (descriptor) => descriptor.verify(options)));
  }
}
