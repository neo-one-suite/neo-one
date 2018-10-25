import { comlink } from '@neo-one/worker';
import _ from 'lodash';
import { filter, map } from 'rxjs/operators';
import * as ReactErrorOverlay from '../../error/ReactErrorOverlay';
import { createFileSystem, createTranspileCache } from '../create';
import { MainEngine, RegisterPreviewEngineResult } from '../main';
import { ModuleBase, RemoteEngine } from '../remote';
import { getPathWithExports } from '../remote/packages';
import { previewPackages } from './previewPackages';

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
        pathWithExports: getPathWithExports(
          {
            fs,
            builderManager,
            jsonRPCLocalProviderManager,
          },
          previewPackages,
        ),
      });
      mutablePreviewEngine = previewEngine;
      transpileCache.changes$
        .pipe(
          map(() => {
            previewEngine.renderJSSafe();
          }),
        )
        .subscribe();
      fs.changes$
        .pipe(
          filter((change) => change.id.startsWith('/node_modules')),
          map(() => {
            previewEngine.renderJSSafe();
          }),
        )
        .subscribe();
    }

    return mutablePreviewEngine;
  }

  public readonly renderJS = _.debounce(async (): Promise<void> => {
    if (this.mutableRunning) {
      this.renderJSSafe();
    }
    this.mutableRunning = true;
    ReactErrorOverlay.dismissBuildError();
    ReactErrorOverlay.dismissRuntimeErrors();
    try {
      const entryModule = this.findEntryModule();
      await entryModule.evaluateAsync({ force: true });
    } catch (error) {
      // Rethrow with a clean stack to allow React overlay to pick it up.
      setTimeout(() => {
        throw error;
      });
    } finally {
      this.mutableRunning = false;
    }
  }, 500);

  private mutableRunning = false;

  public readonly renderJSSafe = () => {
    // tslint:disable-next-line
    this.renderJS();
  };

  public start(): void {
    this.renderHTML();
    ReactErrorOverlay.startReportingRuntimeErrors(this, {});
    this.renderJSSafe();
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
