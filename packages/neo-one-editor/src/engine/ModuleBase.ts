import { EngineBase } from './EngineBase';
import { Exports } from './types';

export interface EvaluateOptions {
  readonly initiator?: ModuleBase;
  readonly force?: boolean;
  readonly useEval?: boolean;
}

export abstract class ModuleBase {
  public constructor(protected readonly engine: EngineBase, public readonly path: string) {}

  public abstract evaluate(options?: EvaluateOptions): Exports;
}
