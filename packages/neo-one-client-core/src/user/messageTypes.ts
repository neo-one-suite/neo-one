// tslint:disable no-any
import { SerializedValueToken } from './serializeUtils';

interface BaseMessage {
  readonly id: string;
}

interface BaseMethodCall extends BaseMessage {
  readonly method: string;
  readonly args: ReadonlyArray<SerializedValueToken>;
  readonly confirm?: boolean;
}

export interface MethodCall extends BaseMethodCall {
  readonly type: 'METHOD';
}

export interface ConfirmationCall extends BaseMethodCall {
  readonly type: 'CONFIRMATION';
}

export interface AsyncIterableReturn extends BaseMethodCall {
  readonly type: 'ASYNCITERABLE';
}

export interface NextCall extends BaseMessage {
  readonly type: 'NEXT';
}

export interface ObservableValue extends BaseMessage {
  readonly type: 'OBSERVABLE';
  readonly value: SerializedValueToken;
}

export interface ReturnValue extends BaseMessage {
  readonly type: 'RETURN';
  readonly value: SerializedValueToken;
}

export interface ErrorValue extends BaseMessage {
  readonly type: 'ERROR';
  readonly value: SerializedValueToken;
}

export type Message =
  | MethodCall
  | ConfirmationCall
  | AsyncIterableReturn
  | ObservableValue
  | NextCall
  | ReturnValue
  | ErrorValue;

export type MessageType = Message['type'];

export interface Endpoint {
  readonly postMessage: (message: Message) => void;
  readonly addEventListener: (listener: (event: Message) => void) => void;
  readonly close: () => void;
}
