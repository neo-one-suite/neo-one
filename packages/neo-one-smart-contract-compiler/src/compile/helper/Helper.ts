import ts from 'typescript';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export abstract class Helper<T extends ts.Node = ts.Node> {
  public emitGlobal(_sb: ScriptBuilder, _node: T, _options: VisitOptions): void {
    // do nothing
  }

  public abstract emit(sb: ScriptBuilder, node: T, options: VisitOptions): void;
}
