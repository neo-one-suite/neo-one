import { ContractParameter, ContractParameterJSON, deserializeContractParameterWireBase } from '../contractParameter';
import { DeserializeWireBaseOptions, SerializableJSON, SerializeJSONContext } from '../Serializable';
import { BinaryWriter } from '../utils';
import { ActionBase, ActionBaseAdd, ActionBaseJSON } from './ActionBase';
import { ActionType } from './ActionType';

export interface NotificationAdd extends ActionBaseAdd {
  readonly args: ReadonlyArray<ContractParameter>;
}

export interface NotificationActionJSON extends ActionBaseJSON {
  readonly type: 'Notification';
  readonly args: ReadonlyArray<ContractParameterJSON>;
}

export class NotificationAction extends ActionBase<NotificationAction, ActionType.Notification>
  implements SerializableJSON<NotificationActionJSON> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): NotificationAction {
    const { reader } = options;
    const action = super.deserializeActionBaseWireBase(options);
    const args = reader.readArray(() => deserializeContractParameterWireBase(options));

    return new this({
      version: action.version,
      index: action.index,
      scriptHash: action.scriptHash,
      args,
    });
  }

  public readonly args: ReadonlyArray<ContractParameter>;

  public constructor({ version, index, scriptHash, args }: NotificationAdd) {
    super({
      type: ActionType.Notification,
      version,
      index,
      scriptHash,
    });

    this.args = args;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeArray(this.args, (arg) => arg.serializeWireBase(writer));
  }

  public serializeJSON(context: SerializeJSONContext): NotificationActionJSON {
    const action = super.serializeActionBaseJSON(context);

    return {
      type: 'Notification',
      version: action.version,
      index: action.index,
      scriptHash: action.scriptHash,
      args: this.args.map((arg) => arg.serializeJSON(context)),
    };
  }
}
