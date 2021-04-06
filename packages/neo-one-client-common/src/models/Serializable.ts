import { BinaryWriter } from '../BinaryWriter';
import { UInt256 } from '../common';

export type SerializeWire = () => Buffer;
// tslint:disable-next-line no-unused
export interface SerializableWire {
  readonly serializeWireBase: (writer: BinaryWriter) => void;
  readonly serializeWire: SerializeWire;
}

export const createSerializeWire = (serializeWireBase: (writer: BinaryWriter) => void): SerializeWire => () => {
  const writer = new BinaryWriter();
  serializeWireBase(writer);

  return writer.toBuffer();
};

export interface SerializableJSON<TJSON> {
  readonly serializeJSON: () => TJSON;
}

export const getSignData = (hash: UInt256, magic: number) => {
  const writer = new BinaryWriter();
  writer.writeUInt32LE(magic);
  writer.writeUInt256(hash);

  return writer.toBuffer();
};
