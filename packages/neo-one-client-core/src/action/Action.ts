import { utils } from '@neo-one/utils';
import BN from 'bn.js';
import { createDeserializeWire, DeserializeWireBaseOptions } from '../Serializable';
import { ActionType, assertActionType } from './ActionType';
import { LogAction, LogActionJSON } from './LogAction';
import { NotificationAction, NotificationActionJSON } from './NotificationAction';

export interface ActionsKey {
  readonly indexStart?: BN;
  readonly indexStop?: BN;
}

export interface ActionKey {
  readonly index: BN;
}

export type Action = LogAction | NotificationAction;

export type ActionJSON = NotificationActionJSON | LogActionJSON;

export type ActionTypeJSON = ActionJSON['type'];

export const deserializeActionWireBase = (options: DeserializeWireBaseOptions): Action => {
  const { reader } = options;
  const type = assertActionType(reader.clone().readUInt8());
  switch (type) {
    case ActionType.Log:
      return LogAction.deserializeWireBase(options);
    case ActionType.Notification:
      return NotificationAction.deserializeWireBase(options);
    default:
      utils.assertNever(type);
      throw new Error('For TS');
  }
};

export const deserializeActionWire = createDeserializeWire(deserializeActionWireBase);
