import { EngineBase } from './EngineBase';
import { ExploreResult, ModuleBase } from './ModuleBase';
import { Exports } from './types';

export class StaticExportsModule extends ModuleBase {
  public constructor(engine: EngineBase, path: string, private readonly exports: Exports) {
    super(engine, path);
  }

  public evaluate(): Exports {
    return this.exports;
  }

  public evaluateExplore(): ExploreResult {
    return { exports: this.exports, missingPaths: [] };
  }

  public async evaluateAsync(): Promise<Exports> {
    return this.exports;
  }
}
