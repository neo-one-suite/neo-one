import { BuiltinInterface as BuiltinInterfaceType, BuiltinType } from './types';

export abstract class BuiltinInterface implements BuiltinInterfaceType {
  public readonly types = new Set([BuiltinType.Interface]);
  public readonly canImplement: boolean = false;
}
