import { Builtin, BuiltinType } from './types';

export class BuiltinBase implements Builtin {
  public readonly types = new Set<BuiltinType>();
}
