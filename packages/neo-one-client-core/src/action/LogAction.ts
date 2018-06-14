import { DeserializeWireBaseOptions, SerializableJSON, SerializeJSONContext } from '../Serializable';
import { BinaryWriter } from '../utils';
import { ActionBase, ActionBaseAdd, ActionBaseJSON } from './ActionBase';
import { ActionType } from './ActionType';

export interface LogAdd extends ActionBaseAdd {
  readonly message: string;
}

export interface LogActionJSON extends ActionBaseJSON {
  readonly type: 'Log';
  readonly message: string;
}

export class LogAction extends ActionBase<LogAction, ActionType.Log> implements SerializableJSON<LogActionJSON> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): LogAction {
    const { reader } = options;
    const action = super.deserializeActionBaseWireBase(options);
    const message = reader.readVarString(1024);

    return new this({
      version: action.version,
      index: action.index,
      scriptHash: action.scriptHash,
      message,
    });
  }

  public readonly message: string;

  public constructor({ version, index, scriptHash, message }: LogAdd) {
    super({
      type: ActionType.Log,
      version,
      index,
      scriptHash,
    });

    this.message = message;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeVarString(this.message);
  }

  public serializeJSON(context: SerializeJSONContext): LogActionJSON {
    const action = super.serializeActionBaseJSON(context);

    return {
      type: 'Log',
      version: action.version,
      index: action.index,
      scriptHash: action.scriptHash,
      message: this.message,
    };
  }
}
