import { Node } from 'ts-simple-ast';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export type ForLoopHelperFunction = (() => void) | undefined;
export interface ForLoopHelperOptions {
  each: (options: VisitOptions) => void;
  initializer?: ForLoopHelperFunction;
  condition: ForLoopHelperFunction;
  incrementor?: ForLoopHelperFunction;
  withScope?: boolean;
}

export class ForLoopHelper extends Helper {
  private readonly each: (options: VisitOptions) => void;
  private readonly initializer: ForLoopHelperFunction;
  private readonly condition: ForLoopHelperFunction;
  private readonly incrementor: ForLoopHelperFunction;
  private readonly withScope: boolean;

  constructor({
    each,
    initializer,
    condition,
    incrementor,
    withScope,
  }: ForLoopHelperOptions) {
    super();
    this.each = each;
    this.initializer = initializer;
    this.condition = condition;
    this.incrementor = incrementor;
    this.withScope = withScope == null ? true : withScope;
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
    if (this.initializer != null) {
      this.initializer();
    }

    sb.withProgramCounter((loopPC) => {
      if (this.condition != null) {
        this.condition();
      }

      if (!loopPC.getFirst().equals(loopPC.getCurrent())) {
        sb.emitJmp(node, 'JMPIFNOT', loopPC.getLast());
      }

      sb.withProgramCounter((breakPC) => {
        sb.withProgramCounter((innerPC) => {
          sb.withProgramCounter((continuePC) => {
            this.each(
              sb.breakPCOptions(
                sb.continuePCOptions(options, continuePC.getLast()),
                breakPC.getLast(),
              ),
            );
            sb.emitJmp(node, 'JMP', innerPC.getLast());
          });

          // Drop continue completion
          sb.emitOp(node, 'DROP');
        });

        if (this.incrementor != null) {
          this.incrementor();
        }

        sb.emitJmp(node, 'JMP', loopPC.getFirst());
      });

      // Drop break completion
      sb.emitOp(node, 'DROP');
    });
  }
}
