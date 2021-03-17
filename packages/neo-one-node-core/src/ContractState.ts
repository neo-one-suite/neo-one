import { common, ContractJSON, JSONHelper, UInt160 } from '@neo-one/client-common';
import { ContractStateModel } from '@neo-one/client-full-common';
import { ContractManifest } from './manifest';
import { NefFile } from './NefFile';
import { assertArrayStackItem, StackItem } from './StackItems';

export interface ContractStateAdd {
  readonly id: number;
  readonly updateCounter: number;
  readonly hash: UInt160;
  readonly nef: NefFile;
  readonly manifest: ContractManifest;
}

export type ContractKey = UInt160;

export class ContractState extends ContractStateModel<ContractManifest, NefFile> {
  public static fromStackItem(stackItem: StackItem): ContractState {
    const { array } = assertArrayStackItem(stackItem);
    const id = array[0].getInteger().toNumber();
    const updateCounter = array[1].getInteger().toNumber();
    const hash = common.bufferToUInt160(array[2].getBuffer());
    const nef = NefFile.deserializeWire({
      buffer: array[3].getBuffer(),
      // TODO: fix this
      context: { validatorsCount: 0, messageMagic: 0 },
    });
    const manifest = ContractManifest.fromStackItem(array[4]);

    return new ContractState({
      id,
      updateCounter,
      hash,
      nef,
      manifest,
    });
  }

  public clone() {
    return new ContractState({
      id: this.id,
      updateCounter: this.updateCounter,
      hash: this.hash,
      nef: this.nef,
      manifest: this.manifest,
    });
  }

  public canCall(manifest: ContractManifest, method: string) {
    return this.manifest.permissions.some((permission) => permission.isAllowed(manifest, method));
  }

  public serializeJSON(): ContractJSON {
    return {
      id: this.id,
      updatecounter: this.updateCounter,
      hash: JSONHelper.writeUInt160(this.hash),
      nef: this.nef.serializeJSON(),
      manifest: this.manifest.serializeJSON(),
    };
  }
}
