import {
  ApplicationLogJSON,
  BinaryWriter,
  createSerializeWire,
  JSONHelper,
  SerializableWire,
  SerializeWire,
  toTriggerTypeJSON,
  toVMStateJSON,
  TriggerType,
  UInt256,
  VMState,
} from '@neo-one/client-common';
import { BN } from 'bn.js';
import { Notification } from './Notification';
import { DeserializeWireBaseOptions, DeserializeWireOptions } from './Serializable';
import { StackItem, stackItemToJSON } from './StackItems';
import { BinaryReader } from './utils';

export interface ApplicationLogAdd {
  readonly txid?: UInt256;
  readonly trigger: TriggerType;
  readonly vmState: VMState;
  readonly gasConsumed: BN;
  readonly stack: readonly StackItem[];
  readonly notifications: readonly Notification[];
}

export class ApplicationLog implements SerializableWire {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): ApplicationLogJSON {
    const { reader } = options;

    return JSON.parse(reader.readVarString());
  }

  public static deserializeWire(options: DeserializeWireOptions): ApplicationLogJSON {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly txid?: UInt256;
  public readonly trigger: TriggerType;
  public readonly vmState: VMState;
  public readonly gasConsumed: BN;
  public readonly stack: readonly StackItem[];
  public readonly notifications: readonly Notification[];
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ txid, trigger, vmState, gasConsumed, stack, notifications }: ApplicationLogAdd) {
    this.txid = txid;
    this.trigger = trigger;
    this.vmState = vmState;
    this.gasConsumed = gasConsumed;
    this.stack = stack;
    this.notifications = notifications;
  }

  public serializeJSON(): ApplicationLogJSON {
    let stack;
    try {
      stack = this.stack.map((item) => stackItemToJSON(item, undefined));
    } catch {
      stack = 'error: recursive reference';
    }

    return {
      txid: this.txid ? JSONHelper.writeUInt256(this.txid) : undefined,
      trigger: toTriggerTypeJSON(this.trigger),
      vmstate: toVMStateJSON(this.vmState),
      gasconsumed: this.gasConsumed.toString(),
      stack,
      notifications: this.notifications.map((n) => n.serializeJSON()),
      logs: [], // TODO: implement this
    };
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeVarString(JSON.stringify(this.serializeJSON()));
  }
}
