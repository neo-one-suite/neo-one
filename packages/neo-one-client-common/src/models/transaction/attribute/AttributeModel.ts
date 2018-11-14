import { BufferAttributeModel } from './BufferAttributeModel';
import { ECPointAttributeModel } from './ECPointAttributeModel';
import { UInt160AttributeModel } from './UInt160AttributeModel';
import { UInt256AttributeModel } from './UInt256AttributeModel';

export type AttributeModel =
  | BufferAttributeModel
  | ECPointAttributeModel
  | UInt160AttributeModel
  | UInt256AttributeModel;
