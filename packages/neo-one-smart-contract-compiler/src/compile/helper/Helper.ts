import { Node } from 'ts-simple-ast';

import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export abstract class Helper<T extends Node = Node> {
  public emitGlobal(sb: ScriptBuilder, node: T, options: VisitOptions): void {
    // do nothing
  }

  public abstract emit(sb: ScriptBuilder, node: T, options: VisitOptions): void;
}
