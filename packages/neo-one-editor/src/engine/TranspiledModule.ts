import _ from 'lodash';
import { RawSourceMap } from 'source-map';
import { EngineBase } from './EngineBase';
import { evaluate } from './eval';
import { EvaluateAsyncOptions, EvaluateOptions, ExploreResult, MissingPath, ModuleBase } from './ModuleBase';
import { Exports } from './types';

const NEEDS_EVAL = Symbol.for('needsEval');

export class TranspiledModule extends ModuleBase {
  private readonly mutableDependents = new Set<ModuleBase>();
  private mutableExports: Exports = NEEDS_EVAL;

  public constructor(
    engine: EngineBase,
    path: string,
    public readonly code: string,
    public readonly sourceMap?: RawSourceMap,
  ) {
    super(engine, path);
  }

  public evaluate({ force = false, initiator }: EvaluateOptions = {}): Exports {
    if (initiator !== undefined) {
      this.mutableDependents.add(initiator);
    }

    if (force || this.mutableExports === NEEDS_EVAL) {
      const { exports } = evaluate(this.engine, this, false);
      this.mutableExports = exports;
    }

    return this.mutableExports;
  }

  public evaluateExplore({ force = false, initiator }: EvaluateOptions = {}): ExploreResult {
    if (initiator !== undefined) {
      this.mutableDependents.add(initiator);
    }

    if (force || this.mutableExports === NEEDS_EVAL) {
      const { exports, missingPaths } = evaluate(this.engine, this, true);
      if (missingPaths.length === 0) {
        this.mutableExports = exports;
      }

      return { exports, missingPaths };
    }

    return { exports: this.mutableExports, missingPaths: [] };
  }

  public async evaluateAsync({
    force = false,
    beforeEvaluate = () => {
      // do nothing
    },
  }: EvaluateAsyncOptions = {}): Promise<Exports> {
    if (force || this.mutableExports === NEEDS_EVAL) {
      beforeEvaluate();
      const { exports, missingPaths: missingPathsIn } = this.evaluateExplore({ force });
      if (missingPathsIn.length === 0) {
        this.mutableExports = exports;

        return exports;
      }

      let missingPaths = this.uniquePaths(missingPathsIn);
      let prevMissingPaths: ReadonlyArray<MissingPath> = [];
      // tslint:disable-next-line no-loop-statement
      while (!this.samePaths(missingPaths, prevMissingPaths)) {
        await this.engine.fetchDependencies(missingPaths);
        prevMissingPaths = missingPaths;
        beforeEvaluate();
        const { missingPaths: nextMissingPaths } = this.evaluateExplore({ force });
        missingPaths = this.uniquePaths(nextMissingPaths);
      }

      beforeEvaluate();

      return this.evaluate({ force });
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

  private uniquePaths(paths: ReadonlyArray<MissingPath>): ReadonlyArray<MissingPath> {
    return _.uniqBy(paths, (path) => `${path.request}:${path.currentPath}`);
  }

  private samePaths(aIn: ReadonlyArray<MissingPath>, bIn: ReadonlyArray<MissingPath>): boolean {
    const sort = [({ request }: MissingPath) => request, ({ currentPath }: MissingPath) => currentPath];
    const a = _.sortBy(aIn, sort);
    const b = _.sortBy(bIn, sort);

    return _.isEqual(a, b);
  }
}
