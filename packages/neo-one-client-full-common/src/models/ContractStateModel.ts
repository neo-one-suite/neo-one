import { ContractManifestModel } from './manifest';
import { UInt160 } from '@neo-one/client-common';

export interface ContractStateModelAdd<TContractManifest extends ContractManifestModel = ContractManifestModel> {
  readonly id: number;
  readonly updateCounter: number;
  readonly hash: UInt160;
  readonly script: Buffer;
  readonly manifest: TContractManifest;
}

export class ContractStateModel<TContractManifest extends ContractManifestModel = ContractManifestModel> {
  public readonly id: number;
  public readonly updateCounter: number;
  public readonly hash: UInt160;
  public readonly script: Buffer;
  public readonly manifest: TContractManifest;

  public constructor({ script, hash, manifest, id, updateCounter }: ContractStateModelAdd<TContractManifest>) {
    this.id = id;
    this.updateCounter = updateCounter;
    this.hash = hash;
    this.script = script;
    this.manifest = manifest;
  }
}
