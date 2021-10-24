import { ExecutionJSON, toTriggerTypeJSON, toVMStateJSON, TriggerType, UInt256, VMState } from '@neo-one/client-common';
import { BN } from 'bn.js';
import { Notification } from './Notification';
import { StackItem } from './StackItems';

export interface ExecutionAdd {
  readonly txid?: UInt256;
  readonly trigger: TriggerType;
  readonly vmState: VMState;
  readonly gasConsumed: BN;
  readonly exception?: string;
  readonly stack: readonly StackItem[];
  readonly notifications: readonly Notification[];
}

export class Execution {
  public readonly trigger: TriggerType;
  public readonly vmState: VMState;
  public readonly gasConsumed: BN;
  public readonly exception?: string;
  public readonly stack: readonly StackItem[];
  public readonly notifications: readonly Notification[];

  public constructor({ trigger, vmState, gasConsumed, stack, notifications, exception }: ExecutionAdd) {
    this.trigger = trigger;
    this.vmState = vmState;
    this.gasConsumed = gasConsumed;
    this.stack = stack;
    this.exception = exception;
    this.notifications = notifications;
  }

  public serializeJSON(): ExecutionJSON {
    let stack;
    try {
      stack = this.stack.map((item) => item.toContractParameter().serializeJSON());
    } catch {
      stack = 'error: recursive reference';
    }

    return {
      trigger: toTriggerTypeJSON(this.trigger),
      vmstate: toVMStateJSON(this.vmState) as 'HALT' | 'FAULT',
      gasconsumed: this.gasConsumed.toString(),
      stack,
      exception: this.exception === undefined ? null : this.exception,
      notifications: this.notifications.map((n) => n.serializeJSON()),
      logs: [],
    };
  }
}
