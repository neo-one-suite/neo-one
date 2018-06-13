import BN from 'bn.js';
import {
  createDeserializeWire,
  DeserializeWire,
  DeserializeWireBaseOptions,
} from '../Serializable';
import { ActionType, assertActionType } from './ActionType';
import { LogAction } from './LogAction';
import { LogActionJSON } from './LogAction';
import { NotificationAction } from './NotificationAction';
import { NotificationActionJSON } from './NotificationAction';

export interface ActionsKey {
  indexStart?: BN;
  indexStop?: BN;
}

export interface ActionKey {
  index: BN;
}

export type Action = LogAction | NotificationAction;

export type ActionJSON = NotificationActionJSON | LogActionJSON;

export type ActionTypeJSON = ActionJSON['type'];

export const deserializeActionWireBase = (
  options: DeserializeWireBaseOptions,
): Action => {
  const { reader } = options;
  const type = assertActionType(reader.clone().readUInt8());
  switch (type) {
    case ActionType.Log:
      return LogAction.deserializeWireBase(options);
    case ActionType.Notification:
      return NotificationAction.deserializeWireBase(options);
  }
};

export const deserializeActionWire: DeserializeWire<
  Action
> = createDeserializeWire(deserializeActionWireBase);
