import { common, crypto, NativeContractJSON, ScriptBuilder, UInt160 } from '@neo-one/client-common';
import {
  BlockchainSettings,
  ContractABI,
  ContractManifest,
  ContractPermission,
  ContractPermissionDescriptor,
  NativeContract as NativeContractNode,
  NefFile,
} from '@neo-one/node-core';
import { KeyBuilder } from './KeyBuilder';
import { contractMethodFromJSON, ContractMethodJSON } from './methods';

export interface NativeContractAdd {
  readonly name: string;
  readonly id: number;
  readonly methods: readonly ContractMethodJSON[];
  readonly settings: BlockchainSettings;
}

export abstract class NativeContract implements NativeContractNode {
  public readonly name: string;
  public readonly nef: NefFile;
  public readonly hash: UInt160;
  public readonly id: number;
  public readonly manifest: ContractManifest;
  public readonly nativeUpdateHistory: readonly number[];

  public constructor({ name, id, methods: methodsIn, settings }: NativeContractAdd) {
    this.name = name;
    this.id = id;
    this.nativeUpdateHistory = settings.nativeUpdateHistory[this.name] ?? [0];

    const methods = methodsIn
      .map(contractMethodFromJSON)
      .sort((a, b) => (a.name.localeCompare(b.name) || a.parameters.length > b.parameters.length ? 1 : -1));

    const builder = new ScriptBuilder();
    methods.forEach(() => {
      builder.emitPushInt(0);
      builder.emitSysCall('System.Contract.CallNative');
      builder.emitOp('RET');
    });
    const script = builder.build();

    this.nef = new NefFile({ compiler: 'neo-core-v3.0', tokens: [], script });
    this.hash = crypto.getContractHash(common.ZERO_UINT160, 0, this.name);
    this.manifest = new ContractManifest({
      name,
      groups: [],
      supportedStandards: [],
      abi: new ContractABI({
        events: [],
        methods,
      }),
      permissions: [new ContractPermission({ contract: new ContractPermissionDescriptor(), methods: '*' })],
      trusts: '*',
      extra: undefined,
    });
  }

  public serializeJSON(): NativeContractJSON {
    return {
      id: this.id,
      hash: common.uInt160ToString(this.hash),
      nef: this.nef.serializeJSON(),
      manifest: this.manifest.serializeJSON(),
      updatehistory: this.nativeUpdateHistory,
    };
  }

  protected createStorageKey(prefix: Buffer) {
    return new KeyBuilder(this.id, prefix);
  }
}
