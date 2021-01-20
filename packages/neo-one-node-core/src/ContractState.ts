import { common, ContractJSON, IOHelper, JSONHelper, UInt160 } from '@neo-one/client-common';
import { ContractStateModel } from '@neo-one/client-full-common';
import { ContractManifest } from './manifest';
import { assertArrayStackItem, StackItem } from './StackItems';
import { utils } from './utils';

export interface ContractStateAdd {
  readonly id: number;
  readonly updateCounter: number;
  readonly hash: UInt160;
  readonly script: Buffer;
  readonly manifest: ContractManifest;
}

export type ContractKey = UInt160;

export class ContractState extends ContractStateModel<ContractManifest> {
  public static fromStackItem(stackItem: StackItem): ContractState {
    const { array } = assertArrayStackItem(stackItem);
    const id = array[0].getInteger().toNumber();
    const updateCounter = array[1].getInteger().toNumber();
    const hash = common.bufferToUInt160(array[2].getBuffer());
    const script = array[3].getBuffer();
    const manifest = ContractManifest.parseBytes(array[4].getBuffer());

    return new ContractState({
      id,
      updateCounter,
      hash,
      script,
      manifest,
    });
  }

  private readonly sizeInternal = utils.lazy(
    () =>
      IOHelper.sizeOfUInt32LE +
      +IOHelper.sizeOfUInt16LE +
      IOHelper.sizeOfUInt160 +
      IOHelper.sizeOfVarBytesLE(this.script) +
      this.manifest.size,
  );

  public get size() {
    return this.sizeInternal();
  }

  public clone() {
    return new ContractState({
      id: this.id,
      updateCounter: this.updateCounter,
      hash: this.hash,
      script: this.script,
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
      script: JSONHelper.writeBase64Buffer(this.script),
      manifest: this.manifest.serializeJSON(),
    };
  }
}
