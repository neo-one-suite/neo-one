import { MemoryFileSystem } from '@neo-one/local-browser';
import { comlink } from '@neo-one/worker';
import _ from 'lodash';
import { Engine } from './Engine';
import { EngineBase, PathWithExports } from './EngineBase';
import { ModuleBase } from './ModuleBase';
import { packages } from './packages';
import { RegisterPreviewEngineResult } from './types';

export interface PreviewEngineCreateOptions {
  readonly port: MessagePort;
}

// tslint:disable-next-line no-let
let mutablePreviewEngine: PreviewEngine | undefined;

export class PreviewEngine extends EngineBase {
  public static async create({ port }: PreviewEngineCreateOptions): Promise<PreviewEngine> {
    if (mutablePreviewEngine === undefined) {
      // tslint:disable-next-line no-any
      const engine: Engine = comlink.proxy(port) as any;
      const fs = new MemoryFileSystem();
      const {
        id,
        builderManager,
        jsonRPCLocalProviderManager,
        transpiler,
      }: RegisterPreviewEngineResult = await engine.registerPreviewEngine({
        // tslint:disable-next-line no-any
        fs: comlink.proxyValue(fs) as any,
      });

      const pathWithExports = packages.reduce<ReadonlyArray<PathWithExports>>(
        (acc, { path, exports }) =>
          acc.concat({
            path,
            exports: exports({ fs, jsonRPCLocalProviderManager, builderManager }),
          }),
        [],
      );

      const previewEngine = new PreviewEngine({ id, fs, pathWithExports, transpiler });
      mutablePreviewEngine = previewEngine;
      mutablePreviewEngine.fs.subscribe((change) => {
        switch (change.type) {
          case 'writeFile':
            previewEngine.renderJS();
            break;
          default:
          // do nothing
        }
      });
    }

    return mutablePreviewEngine;
  }

  public readonly renderJS = _.debounce((): void => {
    try {
      const entryModule = this.findEntryModule();
      entryModule.evaluate({ force: true, useEval: true });
    } catch (error) {
      // tslint:disable-next-line no-console
      console.error(error);
    }
  }, 500);

  public start(): void {
    this.renderHTML();
    this.renderJS();
  }

  public renderHTML(): void {
    const indexHTML = this.findIndexHTML();
    document.open('text/html');
    document.write(indexHTML);
    document.close();
  }

  private findIndexHTML(): string {
    return this.fs.readFileSync('/public/index.html');
  }

  private findEntryModule(): ModuleBase {
    return this.modules['/src/index.tsx'];
  }
}
