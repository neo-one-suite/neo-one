/* @/* @flow */
import { type BinaryWriter, BinaryReader } from '../../utils';
import { type ConsensusMessageType } from './ConsensusMessageType';
import {
  type DeserializeWireBaseOptions,
  type DeserializeWireOptions,
  type SerializeWire,
  type SerializableWire,
  createSerializeWire,
} from '../../Serializable';

export type ConsensusMessageBaseAdd = {|
  viewNumber: number,
|};
export type ConsensusMessageBaseAddWithType<Type: ConsensusMessageType> = {|
  ...ConsensusMessageBaseAdd,
  type: Type,
|};

export default class ConsensusMessageBase<T, Type: ConsensusMessageType>
  implements SerializableWire<T> {
  static VERSION = 0;

  type: Type;
  viewNumber: number;

  constructor({ type, viewNumber }: ConsensusMessageBaseAddWithType<Type>) {
    this.type = type;
    this.viewNumber = viewNumber;
  }

  serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt8(this.type);
    writer.writeUInt8(this.viewNumber);
  }

  serializeWire: SerializeWire = createSerializeWire(
    this.serializeWireBase.bind(this),
  );

  static deserializeConsensusMessageBaseWireBase = ({
    reader,
  }: DeserializeWireBaseOptions) => {
    const type = reader.readUInt8();
    const viewNumber = reader.readUInt8();

    return {
      type,
      viewNumber,
    };
  };

  // eslint-disable-next-line
  static deserializeWireBase(options: DeserializeWireBaseOptions): this {
    throw new Error('Not Implemented');
  }

  static deserializeWire(options: DeserializeWireOptions): this {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }
}
