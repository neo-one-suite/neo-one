import { common, UInt160 } from './common';
import { crypto } from './crypto';
import { GasToken } from './GasToken';
import { scriptHashToAddress } from './helpers';
import { NeoToken } from './NeoToken';
import { PolicyContract } from './PolicyContract';
import { ScriptBuilder } from './ScriptBuilder';
import { AddressString } from './types';

export type NativeContractServiceName = 'Policy' | 'GAS' | 'NEO';

export class NativeContract {
  public static readonly NEO: NeoToken;
  public static readonly GAS: GasToken;
  public static readonly Policy: PolicyContract;

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
