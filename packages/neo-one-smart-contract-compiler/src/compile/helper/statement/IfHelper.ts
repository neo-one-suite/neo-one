import { Node } from 'ts-simple-ast';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface IfHelperOptions {
  condition: () => void;
  whenTrue?: () => void;
  whenFalse?: (() => void) | undefined;
}

export class IfHelper extends Helper {
  private readonly condition: () => void;
  private readonly whenTrue: (() => void) | undefined;
  private readonly whenFalse: (() => void) | undefined;

  constructor({ condition, whenTrue, whenFalse }: IfHelperOptions) {
    super();
    this.condition = condition;
    this.whenTrue = whenTrue;
    this.whenFalse = whenFalse;
  }

  public emit(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    this.condition();
    const { whenTrue, whenFalse } = this;
    if (whenTrue == null) {
      if (whenFalse == null) {
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
          if (this.whenFalse != null) {
            sb.emitJmp(node, 'JMP', whenFalsePC.getLast());
          }
        });

        if (this.whenFalse != null) {
          this.whenFalse();
        }
      });
    }
  }
}
