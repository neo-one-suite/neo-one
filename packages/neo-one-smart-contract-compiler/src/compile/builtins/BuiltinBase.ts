import { Builtin } from './types';

export class BuiltinBase implements Builtin {
  public readonly types = new Set();
}
