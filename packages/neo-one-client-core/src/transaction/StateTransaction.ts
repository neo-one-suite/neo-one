import { BN } from 'bn.js';
import { UInt160Hex } from '../common';
import { InvalidFormatError } from '../errors';
import { DeserializeWireBaseOptions, SerializeJSONContext } from '../Serializable';
import { BinaryWriter, IOHelper, utils } from '../utils';
import { Witness } from '../Witness';
import { Attribute } from './attribute';
import { Input } from './Input';
import { Output } from './Output';
import { StateDescriptor, StateDescriptorJSON } from './state';
import {
  FeeContext,
  TransactionBase,
  TransactionBaseAdd,
  TransactionBaseJSON,
  TransactionGetScriptHashesForVerifyingOptions,
  TransactionVerifyOptions,
} from './TransactionBase';
import { TransactionType } from './TransactionType';

export interface StateTransactionAdd extends TransactionBaseAdd {
  readonly descriptors: ReadonlyArray<StateDescriptor>;
}

export interface StateTransactionJSON extends TransactionBaseJSON {
  readonly type: 'StateTransaction';
  readonly descriptors: ReadonlyArray<StateDescriptorJSON>;
}

export class StateTransaction extends TransactionBase<TransactionType.State, StateTransactionJSON> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): StateTransaction {
    const { reader } = options;
    const { type, version } = super.deserializeTransactionBaseStartWireBase(options);

    if (type !== TransactionType.State) {
      throw new InvalidFormatError();
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

  public readonly descriptors: ReadonlyArray<StateDescriptor>;
  protected readonly sizeExclusive: () => number = utils.lazy(() =>
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
      throw new InvalidFormatError();
    }

    this.stateGetScriptHashesForVerifyingInternal = utils.lazyAsync(
      async (options: TransactionGetScriptHashesForVerifyingOptions) => {
        const mutableHashes = await super.getScriptHashesForVerifying(options);
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
    readonly scripts?: ReadonlyArray<Witness>;
    readonly attributes?: ReadonlyArray<Attribute>;
    readonly inputs?: ReadonlyArray<Input>;
    readonly outputs?: ReadonlyArray<Output>;
  }): StateTransaction {
    return new StateTransaction({
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

  public async verify(options: TransactionVerifyOptions): Promise<void> {
    await Promise.all([super.verify(options), this.verifyInternal(options)]);
  }

  private async verifyInternal(options: TransactionVerifyOptions): Promise<void> {
    await Promise.all(this.descriptors.map(async (descriptor) => descriptor.verify(options)));
  }
}
