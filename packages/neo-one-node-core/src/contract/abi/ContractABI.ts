import { ContractAbiJSON, IOHelper, JSONHelper } from '@neo-one/client-common';
import { ContractABIModel, ContractABIModelAdd } from '@neo-one/client-full-common';
import { DeserializeWireBaseOptions, DeserializeWireOptions, SerializableJSON } from '../../Serializable';
import { BinaryReader, utils } from '../../utils';
import { ContractEvent } from './ContractEvent';
import { ContractFunction } from './ContractFunction';

export type ContractABIAdd = ContractABIModelAdd<ContractFunction, ContractEvent>;

export class ContractABI extends ContractABIModel<ContractFunction, ContractEvent>
  implements SerializableJSON<ContractAbiJSON> {
  public get size(): number {
    return this.sizeInternal();
  }

  public static deserializeWireBase(options: DeserializeWireBaseOptions): ContractABI {
    const { reader } = options;

    const hash = reader.readUInt160();
    const entryPoint = ContractFunction.deserializeWireBase(options);
    const methods = reader.readArray(() => ContractFunction.deserializeWireBase(options));
    const events = reader.readArray(() => ContractEvent.deserializeWireBase(options));

    return new this({
      hash,
      entryPoint,
      methods,
      events,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): ContractABI {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  private readonly sizeInternal = utils.lazy(
    () =>
      IOHelper.sizeOfUInt160 +
      this.entryPoint.size +
      IOHelper.sizeOfArray(this.methods, (method) => method.size) +
      IOHelper.sizeOfArray(this.events, (event) => event.size),
  );

  public clone() {
    return new ContractABI({
      hash: this.hash,
      entryPoint: this.entryPoint.clone(),
      methods: this.methods.map((method) => method.clone()),
      events: this.events.map((event) => event.clone()),
    });
  }

  public serializeJSON(): ContractAbiJSON {
    return {
      hash: JSONHelper.writeUInt160(this.hash),
      entryPoint: this.entryPoint.serializeJSON(),
      methods: this.methods.map((method) => method.serializeJSON()),
      events: this.events.map((event) => event.serializeJSON()),
    };
  }
}
