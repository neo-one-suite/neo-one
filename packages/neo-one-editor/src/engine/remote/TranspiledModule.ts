import _ from 'lodash';
import nanoid from 'nanoid';
import { RawSourceMap } from 'source-map';
import { evaluate } from './eval';
import {
  EvaluateAsyncOptions,
  EvaluateExploreOptions,
  EvaluateOptions,
  ExploreResult,
  MissingPath,
  ModuleBase,
} from './ModuleBase';
import { RemoteEngine } from './RemoteEngine';
import { Exports } from './types';

type MutableExports =
  | { readonly type: 'needsEval' }
  | {
      readonly type: 'exploreEval';
      readonly exports: Exports;
      readonly missingPaths: readonly MissingPath[];
      readonly id: string;
    }
  | { readonly type: 'eval'; readonly exports: Exports };

export class TranspiledModule extends ModuleBase {
  private readonly mutableDependents = new Set<ModuleBase>();
  private mutableExports: MutableExports = { type: 'needsEval' };

  public constructor(
    engine: RemoteEngine,
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

    if (force || this.mutableExports.type === 'needsEval' || this.mutableExports.type === 'exploreEval') {
      const { exports } = evaluate(this.engine, this);
      this.mutableExports = { type: 'eval', exports };
    }

    return this.mutableExports.exports;
  }

  public evaluateExplore({ force = false, initiator, id }: EvaluateExploreOptions): ExploreResult {
    if (initiator !== undefined) {
      this.mutableDependents.add(initiator);
    }

    if (
      force ||
      this.mutableExports.type === 'needsEval' ||
      (this.mutableExports.type === 'exploreEval' &&
        this.mutableExports.id !== id &&
        this.mutableExports.missingPaths.length > 0)
    ) {
      const { exports, missingPaths } = evaluate(this.engine, this, id);
      this.mutableExports = { type: 'exploreEval', exports, missingPaths, id };

      return this.mutableExports;
    }

    if (this.mutableExports.type === 'exploreEval') {
      return this.mutableExports;
    }

    return { exports: this.mutableExports.exports, missingPaths: [] };
  }

  public async evaluateAsync({
    force = false,
    beforeEvaluate = () => {
      // do nothing
    },
    beforeFinalEvaluate = () => {
      // do nothing
    },
  }: EvaluateAsyncOptions = {}): Promise<Exports> {
    if (force || this.mutableExports.type === 'needsEval') {
      beforeEvaluate();
      const { missingPaths: missingPathsIn } = this.evaluateExplore({ force, id: nanoid() });
      if (missingPathsIn.length === 0) {
        beforeEvaluate();
        beforeFinalEvaluate();

        return this.evaluate({ force });
      }

      let missingPaths = this.uniquePaths(missingPathsIn);
      let prevMissingPaths: readonly MissingPath[] = [];
      // tslint:disable-next-line no-loop-statement
      while (!this.samePaths(missingPaths, prevMissingPaths)) {
        await this.engine.fetchDependencies(missingPaths);
        prevMissingPaths = missingPaths;
        beforeEvaluate();
        const { missingPaths: nextMissingPaths } = this.evaluateExplore({ force, id: nanoid() });
        missingPaths = this.uniquePaths(nextMissingPaths);
      }

      beforeEvaluate();
      beforeFinalEvaluate();

      return this.evaluate({ force });
    }

    beforeEvaluate();
    beforeFinalEvaluate();

    return this.evaluate({ force });
  }

  public clearExports(): void {
    this.mutableExports = { type: 'needsEval' };
    this.mutableDependents.forEach((dep) => {
      if (dep instanceof TranspiledModule) {
        dep.clearExports();
      }
    });
  }

  private uniquePaths(paths: readonly MissingPath[]): readonly MissingPath[] {
    return _.uniqBy(paths, (path) => `${path.request}:${path.currentPath}`);
  }

  private samePaths(aIn: readonly MissingPath[], bIn: readonly MissingPath[]): boolean {
    const sort = [({ request }: MissingPath) => request, ({ currentPath }: MissingPath) => currentPath];
    const a = _.sortBy(aIn, sort);
    const b = _.sortBy(bIn, sort);

    return _.isEqual(a, b);
  }
}
