import { common, crypto, ScriptBuilder, UInt160 } from '@neo-one/client-common';
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
  // TODO: newly added property will see if it is relevant on our end
  // public readonly activeBlockIndex: number;

  public constructor({ name, id }: NativeContractAdd) {
    this.name = name;
    this.id = id;

    const builder = new ScriptBuilder();
    builder.emitPushString(this.name);
    builder.emitSysCall('System.Contract.CallNative');
    this.script = builder.build();

    this.hash = crypto.getContractHash(common.ZERO_UINT160, this.script);
  }

  protected createStorageKey(prefix: Buffer) {
    return new KeyBuilder(this.id, prefix);
  }
}
