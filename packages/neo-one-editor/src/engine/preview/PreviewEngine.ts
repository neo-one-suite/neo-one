import { comlink } from '@neo-one/worker';
import _ from 'lodash';
import { filter, map } from 'rxjs/operators';
import * as ReactErrorOverlay from '../../error/ReactErrorOverlay';
import { createFileSystem, createTranspileCache } from '../create';
import { MainEngine, RegisterPreviewEngineResult } from '../main';
import { ModuleBase, RemoteEngine } from '../remote';

export interface PreviewEngineCreateOptions {
  readonly port: MessagePort;
}

// tslint:disable-next-line no-let
let mutablePreviewEngine: PreviewEngine | undefined;

export class PreviewEngine extends RemoteEngine {
  public static async create({ port }: PreviewEngineCreateOptions): Promise<PreviewEngine> {
    if (mutablePreviewEngine === undefined) {
      // tslint:disable-next-line no-any
      const engine: MainEngine = comlink.proxy(port) as any;
      const {
        id,
        endpoint,
        builderManager,
        jsonRPCLocalProviderManager,
        createJSONRPCLocalProviderManager,
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
        createJSONRPCLocalProviderManager,
      });
      mutablePreviewEngine = previewEngine;
      transpileCache.changes$
        .pipe(
          map(() => {
            previewEngine.renderJS();
          }),
        )
        .subscribe();
      fs.changes$
        .pipe(
          filter((change) => change.id.startsWith('/node_modules')),
          map(() => {
            previewEngine.renderJS();
          }),
        )
        .subscribe();
    }

    return mutablePreviewEngine;
  }

  public readonly renderJS = _.debounce((): void => {
    this.renderJSAsync().catch(() => {
      // do nothing, should never happen
    });
  }, 1000);

  private mutableRunning = false;
  private mutableRerun = false;
  private mutableError: Error | undefined;
  private mutableErrorTimeout: number | undefined;

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

  private async renderJSAsync(): Promise<void> {
    if (this.mutableRunning) {
      this.mutableRerun = true;

      return;
    }
    this.mutableRunning = true;
    this.mutableRerun = false;
    ReactErrorOverlay.dismissBuildError();
    ReactErrorOverlay.dismissRuntimeErrors();
    if (this.mutableErrorTimeout !== undefined) {
      clearTimeout(this.mutableErrorTimeout);
      this.mutableErrorTimeout = undefined;
    }
    try {
      const entryModule = this.findEntryModule();
      await entryModule.evaluateAsync({ force: true });
    } catch (error) {
      this.throwLatestError(error);
    } finally {
      this.mutableRunning = false;
      if (this.mutableRerun) {
        this.renderJS();
      }
    }
  }

  private throwLatestError(error: Error): void {
    this.mutableError = error;
    if (this.mutableErrorTimeout === undefined) {
      this.mutableErrorTimeout = setTimeout(() => {
        const err = this.mutableError;
        this.mutableError = undefined;
        this.mutableErrorTimeout = undefined;
        if (!this.mutableRunning && !this.mutableRerun && err !== undefined) {
          throw err;
        }
        // tslint:disable-next-line no-any
      }) as any;
    }
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
