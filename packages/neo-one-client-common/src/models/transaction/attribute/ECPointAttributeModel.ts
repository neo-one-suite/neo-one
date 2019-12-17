import { BinaryWriter } from '../../../BinaryWriter';
import { common, ECPoint } from '../../../common';
import { AttributeBaseModel } from './AttributeBaseModel';

export type ECPointAttributeUsageModel = 0x02 | 0x03;

export interface ECPointAttributeModelAdd {
  readonly usage: ECPointAttributeUsageModel;
  readonly data: ECPoint;
}

export class ECPointAttributeModel extends AttributeBaseModel<ECPointAttributeUsageModel, ECPoint> {
  public readonly usage: ECPointAttributeUsageModel;
  public readonly data: ECPoint;

  public constructor({ usage, data }: ECPointAttributeModelAdd) {
    super();
    this.usage = usage;
    this.data = data;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeBytes(common.ecPointToBuffer(this.data).slice(1));
  }
}
