import { RemoteEngine } from './RemoteEngine';
import { Exports } from './types';

export interface EvaluateBaseOptions {
  readonly force?: boolean;
}

export interface EvaluateAsyncOptions extends EvaluateBaseOptions {
  readonly beforeEvaluate?: () => void;
  readonly beforeFinalEvaluate?: () => void;
}

export interface EvaluateOptions extends EvaluateBaseOptions {
  readonly initiator?: ModuleBase;
}

export interface EvaluateExploreOptions extends EvaluateOptions {
  readonly id: string;
}

export interface MissingPath {
  readonly request: string;
  readonly currentPath: string;
}

export interface ExploreResult {
  readonly exports: Exports;
  readonly missingPaths: readonly MissingPath[];
}

export abstract class ModuleBase {
  public constructor(protected readonly engine: RemoteEngine, public readonly path: string) {}

  public abstract evaluate(options?: EvaluateOptions): Exports;
  public abstract evaluateExplore(options: EvaluateExploreOptions): ExploreResult;
  public abstract async evaluateAsync(options?: EvaluateAsyncOptions): Promise<Exports>;
}
