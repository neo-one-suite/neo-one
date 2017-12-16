/* @flow */
import { InvalidActionTypeError, assertActionType } from './ActionType';
import {
  type DeserializeWire,
  type DeserializeWireBaseOptions,
  createDeserializeWire,
} from '../Serializable';

import LogAction from './LogAction';
import NotificationAction from './NotificationAction';

import type { NotificationActionJSON } from './NotificationAction';
import type { LogActionJSON } from './LogAction';

export type ActionsKey = {|
  blockIndexStart?: number,
  transactionIndexStart?: number,
  indexStart?: number,
  blockIndexStop?: number,
  transactionIndexStop?: number,
  indexStop?: number,
|};
export type ActionKey = {|
  blockIndex: number,
  transactionIndex: number,
  index: number,
|};

export type Action = LogAction | NotificationAction;

export type ActionJSON = NotificationActionJSON | LogActionJSON;

export type ActionTypeJSON = $PropertyType<ActionJSON, 'type'>;

export const deserializeWireBase = (
  options: DeserializeWireBaseOptions,
): Action => {
  const { reader } = options;
  const type = assertActionType(reader.clone().readUInt8());
  switch (type) {
    case 0x00:
      return LogAction.deserializeWireBase(options);
    case 0x01:
      return NotificationAction.deserializeWireBase(options);
    default:
      // eslint-disable-next-line
      (type: empty);
      throw new InvalidActionTypeError(type);
  }
};

export const deserializeWire: DeserializeWire<Action> = createDeserializeWire(
  deserializeWireBase,
);
