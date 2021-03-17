import { BinaryWriter } from '../BinaryWriter';
import { common, UInt160 } from '../common';
import { IOHelper } from '../IOHelper';
import { utils } from '../utils';
import { CallFlags } from './CallFlags';
import { createSerializeWire, SerializableJSON, SerializableWire, SerializeWire } from './Serializable';
import { MethodTokenJSON } from './types';

export interface MethodTokenAdd {
  readonly hash: UInt160;
  readonly method: string;
  readonly paramCount: number;
  readonly hasReturnValue: boolean;
  readonly callFlags: CallFlags;
}

export class MethodTokenModel implements SerializableJSON<MethodTokenJSON>, SerializableWire {
  public get size() {
    return this.sizeInternal();
  }

  public readonly hash: UInt160;
  public readonly method: string;
  public readonly paramCount: number;
  public readonly hasReturnValue: boolean;
  public readonly callFlags: CallFlags;

  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  private readonly sizeInternal = utils.lazy(
    () =>
      IOHelper.sizeOfUInt160 +
      IOHelper.sizeOfVarString(this.method) +
      IOHelper.sizeOfUInt16LE +
      IOHelper.sizeOfBoolean +
      IOHelper.sizeOfUInt8,
  );

  public constructor({ hash, method, paramCount, hasReturnValue, callFlags }: MethodTokenAdd) {
    this.hash = hash;
    this.method = method;
    this.paramCount = paramCount;
    this.hasReturnValue = hasReturnValue;
    this.callFlags = callFlags;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt160(this.hash);
    writer.writeVarString(this.method);
    writer.writeUInt16LE(this.paramCount);
    writer.writeBoolean(this.hasReturnValue);
    writer.writeUInt8(this.callFlags);
  }

  public serializeJSON(): MethodTokenJSON {
    return {
      hash: common.uInt160ToString(this.hash),
      method: this.method,
      paramcount: this.paramCount,
      hasreturnvalue: this.hasReturnValue,
      callflags: this.callFlags,
    };
  }
}
