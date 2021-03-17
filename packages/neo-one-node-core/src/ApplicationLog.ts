import {
  ApplicationLogJSON,
  BinaryReader,
  BinaryWriter,
  createSerializeWire,
  JSONHelper,
  SerializableWire,
  SerializeWire,
  UInt256,
} from '@neo-one/client-common';
import { Execution } from './Execution';
import { DeserializeWireBaseOptions, DeserializeWireOptions } from './Serializable';

export interface ApplicationLogAdd {
  readonly txid?: UInt256;
  readonly blockHash?: UInt256;
  readonly executions: readonly Execution[];
}

export class ApplicationLog implements SerializableWire {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): ApplicationLogJSON {
    const { reader } = options;

    return JSON.parse(reader.readVarString());
  }

  public static deserializeWire(options: DeserializeWireOptions): ApplicationLogJSON {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly txid?: UInt256;
  public readonly blockHash?: UInt256;
  public readonly executions: readonly Execution[];
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ txid, blockHash, executions }: ApplicationLogAdd) {
    this.txid = txid;
    this.blockHash = blockHash;
    this.executions = executions;
  }

  public serializeJSON(): ApplicationLogJSON {
    return {
      txid: this.txid ? JSONHelper.writeUInt256(this.txid) : undefined,
      blockhash: this.blockHash ? JSONHelper.writeUInt256(this.blockHash) : undefined,
      executions: this.executions.map((ex) => ex.serializeJSON()),
    };
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeVarString(JSON.stringify(this.serializeJSON()));
  }
}
