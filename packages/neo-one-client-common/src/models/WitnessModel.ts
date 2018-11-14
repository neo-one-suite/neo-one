import { BinaryWriter } from '../BinaryWriter';
import { createSerializeWire, SerializableWire, SerializeWire } from './Serializable';

export interface WitnessAdd {
  readonly verification: Buffer;
  readonly invocation: Buffer;
}

export class WitnessModel implements SerializableWire<WitnessModel> {
  public readonly verification: Buffer;
  public readonly invocation: Buffer;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ invocation, verification }: WitnessAdd) {
    this.invocation = invocation;
    this.verification = verification;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeVarBytesLE(this.invocation);
    writer.writeVarBytesLE(this.verification);
  }
}
