import { crypto, ScriptBuilder, UInt160 } from '@neo-one/client-common';
import { KeyBuilder } from './KeyBuilder';

export interface NativeContractAdd {
  readonly name: string;
  readonly id: number;
}

export abstract class NativeContract {
  public readonly name: string;
  public readonly script: Buffer;
  public readonly hash: UInt160;
  public readonly id: number;

  public constructor({ name, id }: NativeContractAdd) {
    this.name = name;
    this.id = id;

    const builder = new ScriptBuilder();
    builder.emitPushString(this.name);
    builder.emitSysCall('Neo.Native.Call');
    this.script = builder.build();

    this.hash = crypto.toScriptHash(this.script);
  }

  protected createStorageKey(prefix: Buffer) {
    return new KeyBuilder(this.id, prefix);
  }
}
