import {
  BinaryWriter,
  ConsensusDataJSON,
  createSerializeWire,
  crypto,
  IOHelper,
  JSONHelper,
  SerializeWire,
  UInt256,
} from '@neo-one/client-common';
import { BN } from 'bn.js';
import { MAX_VALIDATORS } from './constants';
import { DeserializeWireBaseOptions, SerializableJSON, SerializableWire, SerializeJSONContext } from './Serializable';
import { utils } from './utils';

export interface ConsensusDataAdd {
  readonly primaryIndex: number;
  readonly nonce: BN;
  readonly hash?: UInt256;
}

export class ConsensusData implements SerializableWire<ConsensusData>, SerializableJSON<ConsensusDataJSON> {
  public static deserializeWireBase({ reader }: DeserializeWireBaseOptions): ConsensusData {
    // TODO: double check this `.toNumber()` is appropriate
    const primaryIndex = reader.readVarUIntLE(new BN(MAX_VALIDATORS - 1)).toNumber();
    const nonce = reader.readUInt64LE();

    return new this({
      primaryIndex,
      nonce,
    });
  }

  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  public readonly primaryIndex: number;
  public readonly nonce: BN;
  private readonly hashInternal: () => UInt256;
  private readonly messageInternal = utils.lazy(() => this.serializeWire());
  private readonly sizeInternal = utils.lazy(
    () => IOHelper.sizeOfVarUIntLE(this.primaryIndex) + IOHelper.sizeOfUInt64LE,
  );

  public constructor({ primaryIndex, nonce, hash: hashIn }: ConsensusDataAdd) {
    this.primaryIndex = primaryIndex;
    this.nonce = nonce;
    this.hashInternal = hashIn === undefined ? utils.lazy(() => crypto.hash256(this.message)) : () => hashIn;
  }

  public get hash(): UInt256 {
    return this.hashInternal();
  }

  public get message(): Buffer {
    return this.messageInternal();
  }

  public get size(): number {
    return this.sizeInternal();
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeVarUIntLE(this.primaryIndex);
    writer.writeUInt64LE(this.nonce);
  }

  public serializeJSON(_context: SerializeJSONContext): ConsensusDataJSON {
    return {
      primary: this.primaryIndex,
      nonce: JSONHelper.writeUInt64LE(this.nonce),
    };
  }
}
