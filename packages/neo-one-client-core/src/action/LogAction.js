/* @flow */
import { ACTION_TYPE } from './ActionType';
import ActionBase, {
  type ActionBaseAdd,
  type ActionBaseJSON,
} from './ActionBase';

import { type BinaryWriter } from '../utils';
import {
  type DeserializeWireBaseOptions,
  type SerializableJSON,
  type SerializeJSONContext,
} from '../Serializable';

export type LogAdd = {|
  ...ActionBaseAdd,
  message: string,
|};

export type LogActionJSON = {|
  ...ActionBaseJSON,
  type: 'Log',
  message: string,
|};

export default class LogAction
  extends ActionBase<LogAction, typeof ACTION_TYPE.LOG>
  implements SerializableJSON<LogActionJSON> {
  message: string;
  constructor({
    version,
    blockIndex,
    blockHash,
    transactionIndex,
    transactionHash,
    index,
    scriptHash,
    message,
  }: LogAdd) {
    super({
      type: ACTION_TYPE.LOG,
      version,
      blockIndex,
      blockHash,
      transactionIndex,
      transactionHash,
      index,
      scriptHash,
    });
    this.message = message;
  }

  serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeVarString(this.message);
  }

  static deserializeWireBase(options: DeserializeWireBaseOptions): this {
    const { reader } = options;
    const action = super.deserializeActionBaseWireBase(options);
    const message = reader.readVarString(1024);

    return new this({
      version: action.version,
      blockIndex: action.blockIndex,
      blockHash: action.blockHash,
      transactionIndex: action.transactionIndex,
      transactionHash: action.transactionHash,
      index: action.index,
      scriptHash: action.scriptHash,
      message,
    });
  }

  serializeJSON(context: SerializeJSONContext): LogActionJSON {
    const action = super.serializeActionBaseJSON(context);
    return {
      type: 'Log',
      version: action.version,
      blockIndex: action.blockIndex,
      blockHash: action.blockHash,
      transactionIndex: action.transactionIndex,
      transactionHash: action.transactionHash,
      index: action.index,
      scriptHash: action.scriptHash,
      message: this.message,
    };
  }
}
