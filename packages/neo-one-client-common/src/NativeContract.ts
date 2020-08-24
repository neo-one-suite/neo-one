import { common, UInt160 } from './common';
import { crypto } from './crypto';
import { scriptHashToAddress } from './helpers';
import { ScriptBuilder } from './ScriptBuilder';
import { AddressString } from './types';

export type NativeContractServiceName = 'Neo.Native.Policy' | 'Neo.Native.Tokens.GAS' | 'Neo.Native.Tokens.NEO';

class NativeContract {
  public readonly serviceName: NativeContractServiceName;
  public readonly script: Buffer;
  public readonly scriptHex: string;
  public readonly hash: UInt160;
  public readonly scriptHash: string;
  public readonly address: AddressString;

  public constructor(serviceName: NativeContractServiceName) {
    this.serviceName = serviceName;
    this.script = new ScriptBuilder()
      .emitPush(Buffer.from(serviceName, 'ascii'))
      .emitSysCall('Neo.Native.Call')
      .build();
    this.scriptHex = this.script.toString('hex');
    this.hash = crypto.toScriptHash(this.script);
    this.scriptHash = common.uInt160ToHex(this.hash);
    this.address = scriptHashToAddress(this.scriptHash);
  }
}

export const NativeContracts = {
  NEO: new NativeContract('Neo.Native.Tokens.NEO'),
  GAS: new NativeContract('Neo.Native.Tokens.GAS'),
  Policy: new NativeContract('Neo.Native.Policy'),
};
