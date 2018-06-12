import BN from 'bn.js';
import { ActionType, assertActionType } from './ActionType';
import {
  DeserializeWire,
  DeserializeWireBaseOptions,
  createDeserializeWire,
} from '../Serializable';
import { LogAction } from './LogAction';
import { NotificationAction } from './NotificationAction';
import { NotificationActionJSON } from './NotificationAction';
import { LogActionJSON } from './LogAction';

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
