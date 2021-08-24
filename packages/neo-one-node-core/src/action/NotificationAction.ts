import { BinaryWriter, NotificationActionJSON } from '@neo-one/client-common';
import { ContractParameter, deserializeContractParameterWireBase } from '../contractParameter';
import { DeserializeWireBaseOptions, SerializableJSON } from '../Serializable';
import { ActionBase, ActionBaseAdd } from './ActionBase';
import { ActionType } from './ActionType';

export interface NotificationActionAdd extends ActionBaseAdd {
  readonly args: readonly ContractParameter[];
  readonly eventName: string;
}

export class NotificationAction
  extends ActionBase<ActionType.Notification>
  implements SerializableJSON<NotificationActionJSON>
{
  public static deserializeWireBase(options: DeserializeWireBaseOptions): NotificationAction {
    const { reader } = options;
    const action = super.deserializeActionBaseWireBase(options);
    const eventName = reader.readVarString();
    const args = reader.readArray(() => deserializeContractParameterWireBase(options));

    return new this({
      version: action.version,
      index: action.index,
      scriptHash: action.scriptHash,
      eventName,
      args,
    });
  }

  public readonly args: readonly ContractParameter[];
  public readonly eventName: string;

  public constructor({ version, index, scriptHash, eventName, args }: NotificationActionAdd) {
    const options = {
      // tslint:disable-next-line no-useless-cast
      type: ActionType.Notification as ActionType.Notification,
      version,
      index,
      scriptHash,
    };
    super(options);

    this.eventName = eventName;
    this.args = args;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeVarString(this.eventName);
    writer.writeArray(this.args, (arg) => arg.serializeWireBase(writer));
  }

  public serializeJSON(): NotificationActionJSON {
    const action = super.serializeActionBaseJSON();

    return {
      type: 'Notification',
      version: action.version,
      index: action.index,
      scriptHash: action.scriptHash,
      eventName: this.eventName,
      args: this.args.map((arg) => arg.serializeJSON()),
    };
  }
}
