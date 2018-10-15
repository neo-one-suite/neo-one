import { EngineBase } from './EngineBase';
import { ModuleBase } from './ModuleBase';

export class TranspiledModule extends ModuleBase {
  public constructor(engine: EngineBase, path: string, private readonly code: string) {
    super(engine, path);
  }

  public getCode(): string {
    return this.code;
  }
}
