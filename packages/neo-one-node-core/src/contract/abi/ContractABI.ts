import { ContractAbiJSON, IOHelper, JSONHelper } from '@neo-one/client-common';
import { ContractABIModel, ContractABIModelAdd } from '@neo-one/client-full-common';
import {
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableJSON,
  SerializeJSONContext,
} from '../../Serializable';
import { BinaryReader, utils } from '../../utils';
import { ContractEvent } from './ContractEvent';
import { ContractFunction } from './ContractFunction';

export interface ContractABIAdd extends ContractABIModelAdd {}

export class ContractABI extends ContractABIModel implements SerializableJSON<ContractAbiJSON> {
  public get size(): number {
    return this.contractABISizeInternal();
  }

  public static deserializeWireBase(options: DeserializeWireBaseOptions): ContractABI {
    return deserializeContractABIWireBase({
      context: options.context,
      reader: options.reader,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): ContractABI {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly entryPointDeserializable: ContractFunction;
  public readonly methodsDeserializable: readonly ContractFunction[];
  public readonly eventsDeserializable: readonly ContractEvent[];

  private readonly contractABISizeInternal = utils.lazy(() =>
    sizeOfContractABI({
      entryPoint: this.entryPointDeserializable,
      methods: this.methodsDeserializable,
      events: this.eventsDeserializable,
    }),
  );

  public constructor({ hash, entryPoint, methods, events }: ContractABIAdd) {
    super({ hash, entryPoint, methods, events });
    this.entryPointDeserializable = new ContractFunction({
      name: entryPoint.name,
      parameters: entryPoint.parameters,
      returnType: entryPoint.returnType,
    });
    this.methodsDeserializable = methods.map(
      (method) =>
        new ContractFunction({ name: method.name, parameters: method.parameters, returnType: method.returnType }),
    );
    this.eventsDeserializable = events.map(
      (event) => new ContractEvent({ name: event.name, parameters: event.parameters }),
    );
  }

  public serializeJSON(context: SerializeJSONContext): ContractAbiJSON {
    return {
      hash: JSONHelper.writeUInt160(this.hash),
      entryPoint: this.entryPointDeserializable.serializeJSON(context),
      methods: this.methodsDeserializable.map((method) => method.serializeJSON(context)),
      events: this.eventsDeserializable.map((event) => event.serializeJSON(context)),
    };
  }
}

export const sizeOfContractABI = ({
  entryPoint,
  methods,
  events,
}: {
  readonly entryPoint: ContractFunction;
  readonly methods: readonly ContractFunction[];
  readonly events: readonly ContractEvent[];
}) =>
  // hash
  IOHelper.sizeOfUInt160 +
  entryPoint.size +
  IOHelper.sizeOfArray(methods, (method) => method.size) +
  IOHelper.sizeOfArray(events, (event) => event.size);

export const deserializeContractABIWireBase = ({ reader, context }: DeserializeWireBaseOptions): ContractABI => {
  const hash = reader.readUInt160();
  const entryPoint = ContractFunction.deserializeWireBase({ reader, context });
  const methods = reader.readArray(() => ContractFunction.deserializeWireBase({ reader, context }));
  const events = reader.readArray(() => ContractEvent.deserializeWireBase({ reader, context }));

  return new ContractABI({
    hash,
    entryPoint,
    methods,
    events,
  });
};
