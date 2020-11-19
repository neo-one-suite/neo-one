import { BinaryWriter, ConsensusDataJSON, crypto, IOHelper, JSONHelper, UInt256 } from '@neo-one/client-common';
import { BN } from 'bn.js';
import { DEFAULT_VALIDATORS_COUNT } from './constants';
import {
  createSerializeWire,
  DeserializeWireBaseOptions,
  SerializableJSON,
  SerializableWire,
  SerializeWire,
} from './Serializable';
import { utils } from './utils';

export interface ConsensusDataAdd {
  readonly primaryIndex: number;
  readonly nonce: BN;
}

export class ConsensusData implements SerializableWire, SerializableJSON<ConsensusDataJSON> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): ConsensusData {
    const { reader } = options;
    const primaryIndex = reader.readVarUIntLE(DEFAULT_VALIDATORS_COUNT.subn(1)).toNumber();
    const nonce = reader.readUInt64LE();

    return new this({
      primaryIndex,
      nonce,
    });
  }

  public readonly primaryIndex: number;
  public readonly nonce: BN;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  public readonly sizeInternal = utils.lazy(
    () => IOHelper.sizeOfVarUIntLE(this.primaryIndex) + IOHelper.sizeOfUInt64LE,
  );
  public readonly hashInternal = utils.lazy(() => crypto.hash256(this.serializeWire()));

  public constructor({ primaryIndex, nonce }: ConsensusDataAdd) {
    this.primaryIndex = primaryIndex;
    this.nonce = nonce;
  }

  public get hash(): UInt256 {
    return this.hashInternal();
  }

  public get size(): number {
    return this.sizeInternal();
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeVarUIntLE(this.primaryIndex);
    writer.writeUInt64LE(this.nonce);
  }

  public serializeJSON() {
    return {
      primary: this.primaryIndex,
      nonce: JSONHelper.writeUInt64LE(this.nonce),
    };
  }
}
