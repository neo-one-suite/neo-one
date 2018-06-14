import { Node } from 'ts-simple-ast';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export type ForLoopHelperFunction = (() => void) | undefined;
export interface ForLoopHelperOptions {
  readonly each: (options: VisitOptions) => void;
  readonly initializer?: ForLoopHelperFunction;
  readonly condition: ForLoopHelperFunction;
  readonly incrementor?: ForLoopHelperFunction;
  readonly withScope?: boolean;
}

export class ForLoopHelper extends Helper {
  private readonly each: (options: VisitOptions) => void;
  private readonly initializer: ForLoopHelperFunction;
  private readonly condition: ForLoopHelperFunction;
  private readonly incrementor: ForLoopHelperFunction;
  private readonly withScope: boolean;

  public constructor({ each, initializer, condition, incrementor, withScope = true }: ForLoopHelperOptions) {
    super();
    this.each = each;
    this.initializer = initializer;
    this.condition = condition;
    this.incrementor = incrementor;
    this.withScope = withScope;
  }

  public emit(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    if (this.withScope) {
      sb.withScope(node, options, (innerOptions) => {
        this.emitLoop(sb, node, innerOptions);
      });
    } else {
      this.emitLoop(sb, node, options);
    }
  }

  private emitLoop(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    if (this.initializer !== undefined) {
      this.initializer();
    }

    sb.withProgramCounter((loopPC) => {
      if (this.condition !== undefined) {
        this.condition();
      }

      if (!loopPC.getFirst().equals(loopPC.getCurrent())) {
        sb.emitJmp(node, 'JMPIFNOT', loopPC.getLast());
      }

      sb.withProgramCounter((breakPC) => {
        sb.withProgramCounter((innerPC) => {
          sb.withProgramCounter((continuePC) => {
            this.each(sb.breakPCOptions(sb.continuePCOptions(options, continuePC.getLast()), breakPC.getLast()));
            sb.emitJmp(node, 'JMP', innerPC.getLast());
          });

          // Drop continue completion
          sb.emitOp(node, 'DROP');
        });

        if (this.incrementor !== undefined) {
          this.incrementor();
        }

        sb.emitJmp(node, 'JMP', loopPC.getFirst());
      });

      // Drop break completion
      sb.emitOp(node, 'DROP');
    });
  }
}
