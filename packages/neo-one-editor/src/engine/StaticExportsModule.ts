import { EngineBase } from './EngineBase';
import { ModuleBase } from './ModuleBase';
import { Exports } from './types';

export class StaticExportsModule extends ModuleBase {
  public constructor(engine: EngineBase, path: string, private readonly exports: Exports) {
    super(engine, path);
  }

  public evaluate(): Exports {
    return this.exports;
  }
}
