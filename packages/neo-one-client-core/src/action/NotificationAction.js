/* @flow */
import { ACTION_TYPE } from './ActionType';
import ActionBase, {
  type ActionBaseAdd,
  type ActionBaseJSON,
} from './ActionBase';
import { type BinaryWriter } from '../utils';
import type { ContractParameterJSON } from '../contractParameter';
import {
  type DeserializeWireBaseOptions,
  type SerializableJSON,
  type SerializeJSONContext,
} from '../Serializable';
import {
  type ContractParameter,
  deserializeWireBase,
} from '../contractParameter';

export type NotificationAdd = {|
  ...ActionBaseAdd,
  args: Array<ContractParameter>,
|};

export type NotificationActionJSON = {|
  ...ActionBaseJSON,
  type: 'Notification',
  args: Array<ContractParameterJSON>,
|};

export default class NotificationAction
  extends ActionBase<NotificationAction, typeof ACTION_TYPE.NOTIFICATION>
  implements SerializableJSON<NotificationActionJSON> {
  args: Array<ContractParameter>;

  constructor({ version, index, scriptHash, args }: NotificationAdd) {
    super({
      type: ACTION_TYPE.NOTIFICATION,
      version,
      index,
      scriptHash,
    });
    this.args = args;
  }

  serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeArray(this.args, (arg) => arg.serializeWireBase(writer));
  }

  static deserializeWireBase(options: DeserializeWireBaseOptions): this {
    const { reader } = options;
    const action = super.deserializeActionBaseWireBase(options);
    const args = reader.readArray(() => deserializeWireBase(options));

    return new this({
      version: action.version,
      index: action.index,
      scriptHash: action.scriptHash,
      args,
    });
  }

  serializeJSON(context: SerializeJSONContext): NotificationActionJSON {
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
