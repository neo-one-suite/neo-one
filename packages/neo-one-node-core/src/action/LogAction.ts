import { BinaryWriter, LogActionJSON } from '@neo-one/client-common';
import { DeserializeWireBaseOptions, SerializableJSON } from '../Serializable';
import { ActionBase, ActionBaseAdd } from './ActionBase';
import { ActionType } from './ActionType';

export interface LogAdd extends ActionBaseAdd {
  readonly message: string;
  readonly position: number;
}

export class LogAction extends ActionBase<ActionType.Log> implements SerializableJSON<LogActionJSON> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): LogAction {
    const { reader } = options;
    const action = super.deserializeActionBaseWireBase(options);
    const position = reader.readUInt32LE();
    const message = reader.readVarString(10240);

    return new this({
      version: action.version,
      index: action.index,
      scriptHash: action.scriptHash,
      message,
      position,
      source: action.source,
    });
  }

  public readonly message: string;
  public readonly position: number;

  public constructor({ version, index, scriptHash, message, position, source }: LogAdd) {
    const options = {
      // tslint:disable-next-line no-useless-cast
      type: ActionType.Log as ActionType.Log,
      version,
      index,
      scriptHash,
      source,
    };
    super(options);

    this.position = position;
    this.message = message;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeUInt32LE(this.position);
    writer.writeVarString(this.message, 10240);
  }

  public serializeJSON(): LogActionJSON {
    const action = super.serializeActionBaseJSON();

    return {
      type: 'Log',
      source: action.source,
      version: action.version,
      index: action.index,
      scriptHash: action.scriptHash,
      message: this.message,
      position: this.position,
    };
  }
}
