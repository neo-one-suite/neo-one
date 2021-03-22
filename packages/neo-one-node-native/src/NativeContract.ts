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
  public get script(): Buffer {
    return this.nef.script;
  }
  public readonly name: string;
  public readonly nef: NefFile;
  public readonly hash: UInt160;
  public readonly id: number;
  public readonly manifest: ContractManifest;
  public readonly activeBlockIndex: number;

  public constructor({ name, id, methods, settings }: NativeContractAdd) {
    this.name = name;
    this.id = id;

    const builder = new ScriptBuilder();
    builder.emitPushInt(this.id);
    builder.emitSysCall('System.Contract.CallNative');
    const script = builder.build();

    this.nef = new NefFile({ compiler: 'neo-core-v3.0', tokens: [], script });
    this.hash = crypto.getContractHash(common.ZERO_UINT160, this.nef.checkSum, this.name);
    this.manifest = new ContractManifest({
      name,
      groups: [],
      supportedStandards: [],
      abi: new ContractABI({
        events: [],
        methods: methods
          .map(contractMethodFromJSON)
          .sort((a, b) => (a.name.localeCompare(b.name) || a.parameters.length > b.parameters.length ? 1 : -1)),
      }),
      permissions: [new ContractPermission({ contract: new ContractPermissionDescriptor(), methods: '*' })],
      trusts: '*',
      extra: undefined,
    });

    this.activeBlockIndex = settings.nativeActivations?.[this.name] ?? 0;
  }

  public serializeJSON(): NativeContractJSON {
    return {
      id: this.id,
      hash: common.uInt160ToString(this.hash),
      nef: this.nef.serializeJSON(),
      manifest: this.manifest.serializeJSON(),
      activeblockindex: this.activeBlockIndex,
    };
  }

  protected createStorageKey(prefix: Buffer) {
    return new KeyBuilder(this.id, prefix);
  }
}
