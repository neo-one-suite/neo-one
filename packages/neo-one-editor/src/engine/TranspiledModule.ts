import { RawSourceMap } from 'source-map';
import { EngineBase } from './EngineBase';
import { evaluate } from './eval';
import { EvaluateOptions, ModuleBase } from './ModuleBase';
import { Exports } from './types';

const NEEDS_EVAL = Symbol.for('needsEval');

export class TranspiledModule extends ModuleBase {
  private readonly mutableDependents = new Set<ModuleBase>();
  private mutableExports: Exports = NEEDS_EVAL;

  public constructor(
    engine: EngineBase,
    path: string,
    public readonly code: string,
    public readonly sourceMap: RawSourceMap,
  ) {
    super(engine, path);
  }

  public evaluate({ force = false, initiator, useEval }: EvaluateOptions = {}): Exports {
    if (initiator !== undefined) {
      this.mutableDependents.add(initiator);
    }

    if (force || this.mutableExports === NEEDS_EVAL) {
      this.mutableExports = evaluate(this.engine, this, useEval);
    }

    return this.mutableExports;
  }

  public clearExports(): void {
    this.mutableExports = NEEDS_EVAL;
    this.mutableDependents.forEach((dep) => {
      if (dep instanceof TranspiledModule) {
        dep.clearExports();
      }
    });
  }
}
