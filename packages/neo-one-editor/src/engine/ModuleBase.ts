import { EngineBase } from './EngineBase';
import { Exports } from './types';

export interface EvaluateAsyncOptions {
  readonly force?: boolean;
}

export interface EvaluateOptions extends EvaluateAsyncOptions {
  readonly initiator?: ModuleBase;
}

export interface MissingPath {
  readonly request: string;
  readonly currentPath: string;
}

export interface ExploreResult {
  readonly exports: Exports;
  readonly missingPaths: ReadonlyArray<MissingPath>;
}

export abstract class ModuleBase {
  public constructor(protected readonly engine: EngineBase, public readonly path: string) {}

  public abstract evaluate(options?: EvaluateOptions): Exports;
  public abstract evaluateExplore(options?: EvaluateOptions): ExploreResult;
  public abstract async evaluateAsync(options?: EvaluateAsyncOptions): Promise<Exports>;
}
