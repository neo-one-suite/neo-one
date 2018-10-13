import { ensureDir } from '@neo-one/local-browser';
import _ from 'lodash';
import * as nodePath from 'path';
import { EngineBase } from '../EngineBase';
import { ModuleBase } from '../ModuleBase';
import { transpile } from './transpile';

export class TranspiledModule extends ModuleBase {
  public readonly transpile = _.debounce(
    (): void => {
      if (this.mutableTranspiling) {
        this.mutableDirty = true;

        return;
      }

      this.mutableTranspiling = true;
      this.doTranspile()
        .then(() => {
          this.mutableTranspiling = false;
        })
        .catch((error) => {
          this.mutableTranspiling = false;
          // tslint:disable-next-line no-console
          console.error(error);
        });
    },
  );

  private mutableTranspiling = false;
  private mutableDirty = false;

  public constructor(engine: EngineBase, path: string, private mutableCode?: string) {
    super(engine, path);
  }

  public getCode(): string {
    if (this.mutableCode === undefined) {
      const content = this.engine.fs.readFileSync(this.path);
      this.mutableCode = transpile(this.path, content);
    }

    return this.mutableCode;
  }

  private async doTranspile(): Promise<void> {
    const instance = await this.engine.transpiler.getInstance();
    const content = this.engine.fs.readFileSync(this.path);
    const result = await instance.transpile(this.path, content);

    if (this.mutableDirty) {
      this.mutableDirty = false;
      await this.doTranspile();
    } else {
      this.mutableCode = result;
      this.clearExports();
      const transpiledPath = this.engine.getTranspiledPath(this.path);
      ensureDir(this.engine.fs, nodePath.dirname(transpiledPath));
      this.engine.fs.writeFileSync(transpiledPath, result);
    }
  }
}
