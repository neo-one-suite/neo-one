import { BuiltinType, BuiltinValueObject as BuiltinValueObjectType } from './types';

export abstract class BuiltinValueObject implements BuiltinValueObjectType {
  public readonly types = new Set([BuiltinType.ValueObject]);
  public abstract readonly type: string;
}
