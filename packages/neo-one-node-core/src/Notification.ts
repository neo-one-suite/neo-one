import { common, UInt160 } from '@neo-one/client-common';
import { assertArrayStackItem, StackItem } from './StackItems';
import { Verifiable } from './Verifiable';

export interface NotificationAdd {
  readonly container?: Verifiable;
  readonly scriptHash: UInt160;
  readonly eventName: string;
  readonly state: readonly StackItem[];
}

export class Notification {
  public static fromStackItem(stackItem: StackItem, container?: Verifiable): Notification {
    const array = assertArrayStackItem(stackItem).array;
    const scriptHash = common.bufferToUInt160(array[0].getBuffer());
    const eventName = array[1].getString();
    const state = assertArrayStackItem(array[2]).array;

    return new Notification({
      container,
      scriptHash,
      eventName,
      state,
    });
  }

  public readonly container?: Verifiable;
  public readonly scriptHash: UInt160;
  public readonly eventName: string;
  public readonly state: readonly StackItem[];

  public constructor({ container, scriptHash, eventName, state }: NotificationAdd) {
    this.container = container;
    this.scriptHash = scriptHash;
    this.eventName = eventName;
    this.state = state;
  }
}
