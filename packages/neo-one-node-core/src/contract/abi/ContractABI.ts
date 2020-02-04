import { common, ContractAbiJSON, IOHelper, JSONHelper } from '@neo-one/client-common';
import { ContractABIModel, ContractABIModelAdd } from '@neo-one/client-full-common';
import { DeserializeWireBaseOptions, DeserializeWireOptions, SerializableJSON } from '../../Serializable';
import { BinaryReader, utils } from '../../utils';
import { ContractEvent } from './ContractEvent';
import { ContractMethodDescriptor } from './ContractMethodDescriptor';

export type ContractABIAdd = ContractABIModelAdd<ContractMethodDescriptor, ContractEvent>;

export class ContractABI extends ContractABIModel<ContractMethodDescriptor, ContractEvent>
  implements SerializableJSON<ContractAbiJSON> {
  public get size(): number {
    return this.sizeInternal();
  }

  public static deserializeWireBase(options: DeserializeWireBaseOptions): ContractABI {
    const { reader } = options;

    const hash = reader.readUInt160();
    const entryPoint = ContractMethodDescriptor.deserializeWireBase(options);
    const methods = reader.readArray(() => ContractMethodDescriptor.deserializeWireBase(options));
    const events = reader.readArray(() => ContractEvent.deserializeWireBase(options));

    return new this({
      hash,
      entryPoint,
      methods,
      events,
    });
  }

  public static fromJSON(abiJSON: ContractAbiJSON): ContractABI {
    const { hash, entryPoint, methods, events } = abiJSON;

    return new ContractABI({
      hash: common.stringToUInt160(hash),
      entryPoint: ContractMethodDescriptor.fromJSON(entryPoint),
      methods: methods.map((method) => ContractMethodDescriptor.fromJSON(method)),
      events: events.map((event) => ContractEvent.fromJSON(event)),
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
