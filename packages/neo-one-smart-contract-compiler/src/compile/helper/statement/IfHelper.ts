import ts from 'typescript';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface IfHelperOptions {
  readonly condition: () => void;
  readonly whenTrue?: () => void;
  readonly whenFalse?: (() => void) | undefined;
}

export class IfHelper extends Helper {
  private readonly condition: () => void;
  private readonly whenTrue: (() => void) | undefined;
  private readonly whenFalse: (() => void) | undefined;

  public constructor({ condition, whenTrue, whenFalse }: IfHelperOptions) {
    super();
    this.condition = condition;
    this.whenTrue = whenTrue;
    this.whenFalse = whenFalse;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, _options: VisitOptions): void {
    this.condition();
    const { whenTrue, whenFalse } = this;
    if (whenTrue === undefined) {
      if (whenFalse === undefined) {
        throw new Error('If statement must have a true or false value');
      }
      sb.withProgramCounter((endPC) => {
        sb.emitJmp(node, 'JMPIF', endPC.getLast());
        whenFalse();
      });
    } else {
      sb.withProgramCounter((whenFalsePC) => {
        sb.withProgramCounter((whenTruePC) => {
          sb.emitJmp(node, 'JMPIFNOT', whenTruePC.getLast());
          whenTrue();
          if (this.whenFalse !== undefined) {
            sb.emitJmp(node, 'JMP', whenFalsePC.getLast());
          }
        });

        if (this.whenFalse !== undefined) {
          this.whenFalse();
        }
      });
    }
  }
}
