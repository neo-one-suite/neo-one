import { BinaryWriter, LogActionJSON } from '@neo-one/client-common';
import { DeserializeWireBaseOptions, SerializableJSON, SerializeJSONContext } from '../Serializable';
import { ActionBase, ActionBaseAdd } from './ActionBase';
import { ActionType } from './ActionType';

export interface LogAdd extends ActionBaseAdd {
  readonly message: string;
}

export class LogAction extends ActionBase<LogAction, ActionType.Log> implements SerializableJSON<LogActionJSON> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): LogAction {
    const { reader } = options;
    const action = super.deserializeActionBaseWireBase(options);
    const message = reader.readVarString(10240);

    return new this({
      version: action.version,
      index: action.index,
      scriptHash: action.scriptHash,
      message,
    });
  }

  public readonly message: string;

  public constructor({ version, index, scriptHash, message }: LogAdd) {
    const options = {
      // tslint:disable-next-line no-useless-cast
      type: ActionType.Log as ActionType.Log,
      version,
      index,
      scriptHash,
    };
    super(options);

    this.message = message;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeVarString(this.message, 10240);
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
