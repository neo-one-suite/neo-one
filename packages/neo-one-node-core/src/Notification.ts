import { common, NotificationJSON, UInt160 } from '@neo-one/client-common';
import { ContractParameter } from './contractParameter';
import { assertArrayStackItem, StackItem } from './StackItems';
import { Verifiable } from './Verifiable';

export interface NotificationAdd {
  readonly container?: Verifiable;
  readonly scriptHash: UInt160;
  readonly eventName: string;
  readonly state: readonly ContractParameter[];
}

export class Notification {
  public static fromStackItem(stackItem: StackItem, container?: Verifiable): Notification {
    const array = assertArrayStackItem(stackItem).array;
    const scriptHash = common.bufferToUInt160(array[0].getBuffer());
    const eventName = array[1].getString();
    const state = assertArrayStackItem(array[2]).array.map((stackItemIn) => stackItemIn.toContractParameter());

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
  public readonly state: readonly ContractParameter[];

  public constructor({ container, scriptHash, eventName, state }: NotificationAdd) {
    this.container = container;
    this.scriptHash = scriptHash;
    this.eventName = eventName;
    this.state = state;
  }

  public serializeJSON(): NotificationJSON {
    let state;
    try {
      state = this.state.map((s) => s.serializeJSON());
    } catch {
      state = 'error: recursive reference';
    }

    return {
      scripthash: common.uInt160ToString(this.scriptHash),
      eventname: this.eventName,
      state,
    };
  }
}
