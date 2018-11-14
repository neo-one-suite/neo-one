import { common, crypto, JSONHelper, OutputJSON, OutputModel, UInt256 } from '@neo-one/client-common';
import BN from 'bn.js';
import { Equals, EquatableKey } from '../Equatable';
import { DeserializeWireBaseOptions, DeserializeWireOptions, SerializeJSONContext } from '../Serializable';
import { BinaryReader, utils } from '../utils';

export interface OutputKey {
  readonly hash: UInt256;
  readonly index: number;
}

export class Output extends OutputModel implements EquatableKey {
  public static deserializeWireBase({ reader }: DeserializeWireBaseOptions): Output {
    const asset = reader.readUInt256();
    const value = reader.readFixed8();
    const address = reader.readUInt160();

    return new this({ asset, value, address });
  }

  public static deserializeWire(options: DeserializeWireOptions): Output {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly equals: Equals = utils.equals(
    Output,
    this,
    (other) =>
      common.uInt256Equal(this.asset, other.asset) &&
      this.value.eq(other.value) &&
      common.uInt160Equal(this.address, other.address),
  );
  public readonly toKeyString = utils.toKeyString(
    Output,
    () => `${common.uInt256ToString(this.asset)}:${this.value.toString(10)}:${common.uInt160ToString(this.address)}`,
  );

  public clone({ value = this.value }: { readonly value?: BN }): Output {
    return new Output({
      asset: this.asset,
      value,
      address: this.address,
    });
  }

  public serializeJSON(context: SerializeJSONContext, index: number): OutputJSON {
    return {
      n: index,
      asset: JSONHelper.writeUInt256(this.asset),
      value: JSONHelper.writeFixed8(this.value),
      address: crypto.scriptHashToAddress({
        addressVersion: context.addressVersion,
        scriptHash: this.address,
      }),
    };
  }
}
