import { normalizePath, PouchDBFileSystem, PouchDBFileSystemDoc } from '@neo-one/local-browser';
import { comlink } from '@neo-one/worker';
import { EditorFile } from '../editor';
import { EngineContentFile, EngineContentFiles, TestRunnerCallbacks } from '../types';
import { getFileType } from '../utils';
import { EngineContext } from './createEngineContext';
import { EngineBase } from './EngineBase';
import { ModuleBase } from './ModuleBase';
import { TestRunner } from './test';
import { Transpiler, transpilerManager } from './transpile';
import { RegisterPreviewEngineResult } from './types';

export interface EngineCreateOptions {
  readonly context: EngineContext;
  readonly initialFiles: EngineContentFiles;
  readonly testRunnerCallbacks: TestRunnerCallbacks;
}

interface EngineOptions {
  readonly context: EngineContext;
  readonly initialFiles: Map<string, EngineContentFile>;
  readonly fsChanges: PouchDB.Core.Changes<PouchDBFileSystemDoc>;
  readonly testRunnerCallbacks: TestRunnerCallbacks;
}

const maybeTranspile = async (
  transpiler: Transpiler,
  transpileCache: PouchDBFileSystem,
  pathIn: string,
  content: string,
): Promise<void> => {
  const path = normalizePath(pathIn);
  const fileType = getFileType(path);
  if ((fileType === 'typescript' || fileType === 'javascript') && !path.startsWith('/node_modules')) {
    const result = await transpiler.transpile(path, content);
    await transpileCache.writeFile(path, JSON.stringify(result));
  }
};

export class Engine extends EngineBase {
  public static async create({ context, initialFiles, testRunnerCallbacks }: EngineCreateOptions): Promise<Engine> {
    await Promise.all(
      initialFiles.map(async (file) => {
        try {
          context.fs.readFileSync(file.path);
        } catch {
          await context.fs.writeFile(file.path, file.content);
        }
      }),
    );

    const [fsChanges, transpilePromises] = await transpilerManager.withInstance<
      [PouchDB.Core.Changes<PouchDBFileSystemDoc>, Array<Promise<void>>]
    >(async (transpiler) => {
      const mutableTranspilePromises: Array<Promise<void>> = [];
      context.fs.files.forEach((file, path) => {
        mutableTranspilePromises.push(maybeTranspile(transpiler, context.transpileCache, path, file.content));
      });
      const fsChangesInner = context.fs.db
        .changes({ since: 'now', live: true, include_docs: true })
        .on('change', (change) => {
          if (change.doc === undefined) {
            context.transpileCache.removeFile(change.id).catch((error) => {
              // tslint:disable-next-line no-console
              console.error(error);
            });
          } else {
            const doc = change.doc;
            transpilerManager
              .withInstance(async (transpilerInner) => {
                await maybeTranspile(transpilerInner, context.transpileCache, change.id, doc.content);
              })
              .catch((error) => {
                // tslint:disable-next-line no-console
                console.error(error);
              });
          }
        });

      return [fsChangesInner, mutableTranspilePromises];
    });

    await Promise.all(transpilePromises);

    if (context.openFiles$.getValue().length === 0) {
      context.openFiles$.next(initialFiles.filter((file) => file.open).map((file) => file.path));
    }
    const initialFilesMap = new Map<string, EngineContentFile>();
    initialFiles.forEach((file) => {
      initialFilesMap.set(file.path, file);
    });

    return new Engine({ context, initialFiles: initialFilesMap, testRunnerCallbacks, fsChanges });
  }

  public readonly context: EngineContext;
  private readonly initialFiles: Map<string, EngineContentFile>;
  private readonly testRunner: TestRunner;
  private readonly fsChanges: PouchDB.Core.Changes<PouchDBFileSystemDoc>;

  private constructor({ context, initialFiles, testRunnerCallbacks, fsChanges }: EngineOptions) {
    super({
      fs: context.fs,
      transpileCache: context.transpileCache,
      builderManager: context.builderManager,
      jsonRPCLocalProviderManager: context.jsonRPCLocalProviderManager,
    });
    this.context = context;
    this.initialFiles = initialFiles;
    this.testRunner = new TestRunner(this, testRunnerCallbacks);
    this.fsChanges = fsChanges;
  }

  public async dispose(): Promise<void> {
    await super.dispose();
    this.fsChanges.cancel();
    await this.context.dispose();
  }

  public async build(): Promise<void> {
    this.context.output$.next({ owner: 'neo-one', message: 'Building...' });

    await this.context.builderManager.withInstance(async (builder) => builder.build());
  }

  public getFile(path: string): EditorFile {
    const initialFile = this.initialFiles.get(path);

    return { path, writable: initialFile === undefined ? true : initialFile.writable };
  }

  public runTests(): void {
    this.testRunner.runTests().catch((error) => {
      // tslint:disable-next-line no-console
      console.error(error);
    });
  }

  public runTest(path: string): void {
    this.testRunner.runTest(path).catch((error) => {
      // tslint:disable-next-line no-console
      console.error(error);
    });
  }

  public getGlobals(mod: ModuleBase) {
    return {
      ...this.testRunner.getTestGlobals(mod),
      ...super.getGlobals(mod),
    };
  }

  public async registerPreviewEngine(): Promise<RegisterPreviewEngineResult> {
    return {
      id: this.context.id,
      endpoint: this.context.fileSystemManager.getEndpoint(),
      builderManager: comlink.proxyValue(this.context.builderManager),
      jsonRPCLocalProviderManager: comlink.proxyValue(this.context.jsonRPCLocalProviderManager),
    };
  }
}
