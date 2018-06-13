import BN from 'bn.js';
import { UInt160Hex } from '../common';
import { InvalidFormatError } from '../errors';
import {
  DeserializeWireBaseOptions,
  SerializeJSONContext,
} from '../Serializable';
import { BinaryWriter, IOHelper, utils } from '../utils';
import { Witness } from '../Witness';
import { Attribute } from './attribute';
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
  descriptors: StateDescriptor[];
}

export interface StateTransactionJSON extends TransactionBaseJSON {
  type: 'StateTransaction';
  descriptors: StateDescriptorJSON[];
}

export class StateTransaction extends TransactionBase<
  TransactionType.State,
  StateTransactionJSON
> {
  public static deserializeWireBase(
    options: DeserializeWireBaseOptions,
  ): StateTransaction {
    const { reader } = options;
    const { type, version } = super.deserializeTransactionBaseStartWireBase(
      options,
    );

    if (type !== TransactionType.State) {
      throw new InvalidFormatError();
    }

    const descriptors = reader.readArray(() =>
      StateDescriptor.deserializeWireBase(options),
    );

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
      descriptors,
    });
  }

  public readonly descriptors: StateDescriptor[];
  protected readonly sizeExclusive: () => number = utils.lazy(
    () =>
      super.size +
      IOHelper.sizeOfArray(this.descriptors, (descriptor) => descriptor.size),
  );
  private readonly stateGetScriptHashesForVerifyingInternal: (
    options: TransactionGetScriptHashesForVerifyingOptions,
  ) => Promise<Set<UInt160Hex>>;

  constructor({
    version,
    attributes,
    inputs,
    outputs,
    scripts,
    hash,
    descriptors,
  }: StateTransactionAdd) {
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
        const hashes = await super.getScriptHashesForVerifying(options);
        for (const descriptor of this.descriptors) {
          for (const scriptHash of descriptor.getScriptHashesForVerifying()) {
            hashes.add(scriptHash);
          }
        }

        return hashes;
      },
    );
  }

  public getSystemFee(context: FeeContext): BN {
    return this.descriptors.reduce(
      (value, descriptor) => value.add(descriptor.getSystemFee(context)),
      utils.ZERO,
    );
  }

  public async getScriptHashesForVerifying(
    options: TransactionGetScriptHashesForVerifyingOptions,
  ): Promise<Set<UInt160Hex>> {
    return this.stateGetScriptHashesForVerifyingInternal(options);
  }

  public clone({
    scripts,
    attributes,
  }: {
    scripts?: Witness[];
    attributes?: Attribute[];
  }): StateTransaction {
    return new StateTransaction({
      version: this.version,
      attributes: attributes || this.attributes,
      inputs: this.inputs,
      outputs: this.outputs,
      scripts: scripts || this.scripts,
      descriptors: this.descriptors,
    });
  }

  public serializeExclusiveBase(writer: BinaryWriter): void {
    writer.writeArray(this.descriptors, (descriptor) => {
      descriptor.serializeWireBase(writer);
    });
  }

  public async serializeJSON(
    context: SerializeJSONContext,
  ): Promise<StateTransactionJSON> {
    const transactionBaseJSON = await super.serializeTransactionBaseJSON(
      context,
    );

    return {
      ...transactionBaseJSON,
      type: 'StateTransaction',
      descriptors: this.descriptors.map((descriptor) =>
        descriptor.serializeJSON(context),
      ),
    };
  }

  public async verify(options: TransactionVerifyOptions): Promise<void> {
    await Promise.all([super.verify(options), this.verifyInternal(options)]);
  }

  private async verifyInternal(
    options: TransactionVerifyOptions,
  ): Promise<void> {
    await Promise.all(
      this.descriptors.map((descriptor) => descriptor.verify(options)),
    );
  }
}
