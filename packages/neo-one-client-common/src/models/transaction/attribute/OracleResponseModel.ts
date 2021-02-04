import { BN } from 'bn.js';
import { BinaryWriter } from '../../../BinaryWriter';
import { IOHelper } from '../../../IOHelper';
import { AttributeBaseModel } from './AttributeBaseModel';
import { AttributeTypeModel } from './AttributeTypeModel';
import { OracleResponseCode } from './OracleResponseCode';

export interface OracleResponseModelAdd {
  readonly id: BN;
  readonly code: OracleResponseCode;
  readonly result: Buffer;
}

export class OracleResponseModel extends AttributeBaseModel {
  public readonly type = AttributeTypeModel.OracleResponse;
  public readonly allowMultiple = false;
  public readonly id: BN;
  public readonly code: OracleResponseCode;
  public readonly result: Buffer;

  public constructor({ id, code, result }: OracleResponseModelAdd) {
    super();
    this.id = id;
    this.code = code;
    this.result = result;
  }

  protected serializeWithoutTypeBase(writer: BinaryWriter) {
    writer.writeUInt64LE(this.id);
    writer.writeUInt8(this.code);
    writer.writeVarBytesLE(this.result);
  }

  protected sizeExclusive(): number {
    return IOHelper.sizeOfUInt64LE + IOHelper.sizeOfUInt8 + IOHelper.sizeOfVarBytesLE(this.result);
  }
}
