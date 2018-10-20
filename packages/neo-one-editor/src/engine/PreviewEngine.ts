import { comlink } from '@neo-one/worker';
import _ from 'lodash';
import { map } from 'rxjs/operators';
import * as ReactErrorOverlay from '../error/ReactErrorOverlay';
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
        openFile,
      }: RegisterPreviewEngineResult = await engine.registerPreviewEngine({
        onBuildError: async (error) => {
          ReactErrorOverlay.reportBuildError(error);
        },
      });
      ReactErrorOverlay.setEditorHandler(({ fileName, lineNumber, colNumber }) => {
        const col = colNumber === undefined ? 1 : colNumber;

        openFile(fileName, {
          startLineNumber: lineNumber,
          endLineNumber: lineNumber,
          startColumn: col,
          endColumn: col,
        });
      });
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
      transpileCache.changes$
        .pipe(
          map(() => {
            previewEngine.renderJS();
          }),
        )
        .subscribe();
    }

    return mutablePreviewEngine;
  }

  public readonly renderJS = _.debounce((): void => {
    ReactErrorOverlay.dismissBuildError();
    ReactErrorOverlay.dismissRuntimeErrors();
    try {
      const entryModule = this.findEntryModule();
      entryModule.evaluate({ force: true, useEval: true });
    } catch (error) {
      // Rethrow with a clean stack to allow React overlay to pick it up.
      setTimeout(() => {
        throw error;
      });
    }
  }, 500);

  public start(): void {
    this.renderHTML();
    ReactErrorOverlay.startReportingRuntimeErrors(this, {});
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
