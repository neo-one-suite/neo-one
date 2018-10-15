import { comlink } from '@neo-one/worker';
import _ from 'lodash';
import { createFileSystem, createTranspileCache } from './create';
import { Engine } from './Engine';
import { EngineBase } from './EngineBase';
import { ModuleBase } from './ModuleBase';
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
      const {
        id,
        endpoint,
        builderManager,
        jsonRPCLocalProviderManager,
      }: RegisterPreviewEngineResult = await engine.registerPreviewEngine();
      const [fs, transpileCache] = await Promise.all([
        createFileSystem(id, endpoint),
        createTranspileCache(id, endpoint),
      ]);
      const previewEngine = new PreviewEngine({
        fs,
        transpileCache,
        builderManager,
        jsonRPCLocalProviderManager,
      });
      mutablePreviewEngine = previewEngine;
      transpileCache.changes.on('change', () => {
        previewEngine.renderJS();
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
    const entry = this.modules.get('/src/index.tsx');
    if (entry === undefined) {
      throw new Error('Could not find entry file');
    }

    return entry;
  }
}
