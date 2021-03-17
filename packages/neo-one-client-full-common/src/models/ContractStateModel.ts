import { NefFileModel, UInt160 } from '@neo-one/client-common';
import { ContractManifestModel } from './manifest';

export interface ContractStateModelAdd<
  TContractManifest extends ContractManifestModel = ContractManifestModel,
  TNefFile extends NefFileModel = NefFileModel
> {
  readonly id: number;
  readonly updateCounter: number;
  readonly hash: UInt160;
  readonly nef: TNefFile;
  readonly manifest: TContractManifest;
}

export class ContractStateModel<
  TContractManifest extends ContractManifestModel = ContractManifestModel,
  TNefFile extends NefFileModel = NefFileModel
> {
  public readonly id: number;
  public readonly updateCounter: number;
  public readonly hash: UInt160;
  public readonly nef: TNefFile;
  public readonly manifest: TContractManifest;

  public constructor({ nef, hash, manifest, id, updateCounter }: ContractStateModelAdd<TContractManifest, TNefFile>) {
    this.id = id;
    this.updateCounter = updateCounter;
    this.hash = hash;
    this.nef = nef;
    this.manifest = manifest;
  }
}
