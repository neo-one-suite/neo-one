// tslint:disable no-submodule-imports
import {
  Builder,
  createChanges$,
  createEndpointPouchDB,
  normalizePath,
  OutputMessage,
  PouchDBFileSystem,
} from '@neo-one/local-browser';
import { createBuilderManager, createFileSystemManager, FileSystemManager } from '@neo-one/local-browser-worker';
import {
  createJSONRPCLocalProviderManager,
  createMemoryJSONRPCLocalProviderManager,
} from '@neo-one/node-browser-worker';
import { JSONRPCLocalProvider } from '@neo-one/node-browser/src';
import { mergeScanLatest, retryBackoff } from '@neo-one/utils';
import { comlink, WorkerManager } from '@neo-one/worker';
import { BehaviorSubject, Subject, Subscription } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { EditorFile, TextRange } from '../../editor';
import { managePackages } from '../../manager';
import { setupEditor } from '../../monaco/editor';
import { setupLanguages } from '../../monaco/language';
import { EngineContentFile, EngineContentFiles, TestRunnerCallbacks } from '../../types';
import { getFileType } from '../../utils';
import { createFileSystem, createTranspileCache, getFileSystemDBID } from '../create';
import { createTestRunnerManager, TestRunner } from '../test';
import { initializeFileSystem } from './initializeFileSystem';
import { Transpiler, transpilerManager } from './transpile';
import { RegisterPreviewEngineResult } from './types';

export interface EditorCallbacks {
  readonly openFile: (file: EditorFile, range?: TextRange) => void;
}

interface EngineMeta {
  readonly openFiles: readonly string[];
}

interface EngineMetaWithRev {
  readonly doc: EngineMeta;
  readonly _rev: string;
}

const META_KEY = 'meta';
const handleMeta = async (metaDB: PouchDB.Database<EngineMeta>, fs: PouchDBFileSystem): Promise<EngineMetaWithRev> => {
  const metaResult = await metaDB.get(META_KEY).catch((error) => {
    if (error.reason !== 'missing') {
      // tslint:disable-next-line no-console
      console.error(error);
    }
  });

  let meta: EngineMetaWithRev;
  if (metaResult === undefined) {
    let shouldInitialize = false;
    try {
      const doc = { openFiles: [] };
      const { rev } = await metaDB.put({ _id: META_KEY, ...doc });
      meta = { doc, _rev: rev };
      shouldInitialize = true;
    } catch {
      const metaResultTryTwo = await metaDB.get(META_KEY);
      meta = { doc: { openFiles: metaResultTryTwo.openFiles }, _rev: metaResultTryTwo._rev };
    }

    if (shouldInitialize) {
      try {
        await initializeFileSystem(fs);
      } catch (error) {
        await metaDB.remove({ _id: META_KEY, _rev: meta._rev });
        throw error;
      }
    }
  } else {
    meta = { doc: { openFiles: metaResult.openFiles }, _rev: metaResult._rev };
  }

  return meta;
};

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

interface RegisterPreviewEngineOptions {
  readonly onBuildError: (error: string) => Promise<void>;
}

interface CreateMainEngineOptions {
  readonly id: string;
  readonly createPreviewURL: () => string;
  readonly initialFiles: EngineContentFiles;
  readonly editorCallbacks: EditorCallbacks;
  readonly testRunnerCallbacks: TestRunnerCallbacks;
  readonly clearFS?: boolean;
}

export type Files = readonly string[];

interface MainEngineOptions {
  readonly fs: PouchDBFileSystem;
  readonly output$: Subject<OutputMessage>;
  readonly createPreviewURL: () => string;
  readonly dispose: () => Promise<void>;
  readonly id: string;
  readonly buildErrors$: Subject<string>;
  readonly openFiles$: BehaviorSubject<Files>;
  readonly initialFiles: Map<string, EngineContentFile>;
  readonly editorCallbacks: EditorCallbacks;
  readonly fileSystemManager: FileSystemManager;
  readonly builderManager: WorkerManager<typeof Builder>;
  readonly jsonRPCLocalProviderManager: WorkerManager<typeof JSONRPCLocalProvider>;
  readonly testRunnerManager: WorkerManager<typeof TestRunner>;
  readonly fsSubscription: Subscription;
}

export class MainEngine {
  public static async create({
    id,
    createPreviewURL,
    initialFiles,
    editorCallbacks,
    testRunnerCallbacks,
    clearFS,
  }: CreateMainEngineOptions): Promise<MainEngine> {
    const fileSystemManager = createFileSystemManager();
    const metaDB = createEndpointPouchDB<EngineMeta>(`${id}-meta`, fileSystemManager.worker);
    const [fs, transpileCache] = await Promise.all([
      createFileSystem(id, fileSystemManager.worker),
      createTranspileCache(id, fileSystemManager.worker),
    ]);

    let meta = await handleMeta(metaDB, fs);
    const metaSubscription = createChanges$(metaDB)
      .pipe(
        retryBackoff(1000),
        map((change) => {
          if (change.id === META_KEY && change.doc !== undefined) {
            meta = { doc: change.doc, _rev: change.doc._rev };
          }
        }),
      )
      .subscribe();

    const openFiles$ = new BehaviorSubject<Files>(meta.doc.openFiles);
    const openFilesSubscription = openFiles$.subscribe({
      next: (nextOpenFiles) => {
        metaDB.put({ _id: META_KEY, _rev: meta._rev, openFiles: nextOpenFiles }).catch((error) => {
          // tslint:disable-next-line no-console
          console.error(error);
        });
      },
    });

    const output$ = new Subject<OutputMessage>();
    let builderManager: WorkerManager<typeof Builder>;
    const jsonRPCLocalProviderManager = createJSONRPCLocalProviderManager(id, async () =>
      builderManager.withInstance((instance) => instance.build()),
    );
    builderManager = createBuilderManager(
      getFileSystemDBID(id),
      () => fileSystemManager.getEndpoint(),
      output$,
      jsonRPCLocalProviderManager,
    );
    const languagesDisposable = await setupLanguages(fileSystemManager, fs, id, openFiles$);
    const managePackagesDisposable = managePackages(fs);

    await Promise.all(
      initialFiles.map(async (file) => {
        if (clearFS) {
          await fs.writeFile(file.path, file.content);
        } else {
          try {
            fs.readFileSync(file.path);
          } catch {
            await fs.writeFile(file.path, file.content);
          }
        }
      }),
    );

    const buildErrors$ = new Subject<string>();
    const [fsSubscription, transpilePromises] = await transpilerManager.withInstance<
      [Subscription, Array<Promise<void>>]
    >(async (transpiler) => {
      const mutableTranspilePromises: Array<Promise<void>> = [];
      fs.files.forEach((file, path) => {
        mutableTranspilePromises.push(maybeTranspile(transpiler, transpileCache, path, file.content));
      });
      const fsSubscriptionInner = fs
        .bufferedChanges$()
        .pipe(
          mergeScanLatest(async (_acc, changes) => {
            try {
              await transpilerManager.withInstance(async (transpilerInner) => {
                await Promise.all(
                  changes.map(async (change) => {
                    if (change.doc === undefined) {
                      transpileCache.removeFile(change.id).catch((error) => {
                        // tslint:disable-next-line no-console
                        console.error(error);
                      });
                    } else {
                      await maybeTranspile(transpilerInner, transpileCache, change.id, change.doc.content);
                    }
                  }),
                );
              });
            } catch (error) {
              buildErrors$.next(error.message);
            }
          }),
        )
        .subscribe();

      return [fsSubscriptionInner, mutableTranspilePromises];
    });

    try {
      await Promise.all(transpilePromises);
    } catch (error) {
      buildErrors$.next(error.message);
    }

    if (openFiles$.getValue().length === 0) {
      openFiles$.next(initialFiles.filter((file) => file.open).map((file) => normalizePath(file.path)));
    }
    const initialFilesMap = new Map<string, EngineContentFile>();
    initialFiles.forEach((file) => {
      initialFilesMap.set(normalizePath(file.path), file);
    });

    const testRunnerManager = createTestRunnerManager(
      id,
      () => fileSystemManager.getEndpoint(),
      builderManager,
      jsonRPCLocalProviderManager,
      () =>
        createMemoryJSONRPCLocalProviderManager(async () =>
          builderManager.withInstance((instance) => instance.build()),
        ),
      testRunnerCallbacks,
    );

    const engine = new MainEngine({
      fs,
      output$,
      createPreviewURL,
      dispose: async () => {
        metaSubscription.unsubscribe();
        fsSubscription.unsubscribe();
        openFilesSubscription.unsubscribe();
        languagesDisposable.dispose();
        builderManager.dispose();
        jsonRPCLocalProviderManager.dispose();
        managePackagesDisposable.dispose();
        testRunnerManager.dispose();
        await Promise.all([fs.dispose(), transpileCache.dispose(), metaDB.close()]);
      },
      id,
      buildErrors$,
      openFiles$,
      initialFiles: initialFilesMap,
      editorCallbacks,
      fileSystemManager,
      builderManager,
      jsonRPCLocalProviderManager,
      testRunnerManager,
      fsSubscription,
    });

    setupEditor({ openFile: (path: string, range?: TextRange) => engine.openFile(path, range) });

    return engine;
  }

  public readonly fs: PouchDBFileSystem;
  public readonly output$: Subject<OutputMessage>;
  public readonly openFiles$: BehaviorSubject<Files>;
  public readonly createPreviewURL: () => string;
  public readonly dispose: () => Promise<void>;
  private readonly id: string;
  private readonly buildErrors$: Subject<string>;
  private readonly initialFiles: Map<string, EngineContentFile>;
  private readonly editorCallbacks: EditorCallbacks;
  private readonly fileSystemManager: FileSystemManager;
  private readonly builderManager: WorkerManager<typeof Builder>;
  private readonly jsonRPCLocalProviderManager: WorkerManager<typeof JSONRPCLocalProvider>;
  private readonly testRunnerManager: WorkerManager<typeof TestRunner>;
  private readonly fsSubscription: Subscription;

  public constructor({
    fs,
    output$,
    openFiles$,
    createPreviewURL,
    dispose,
    id,
    buildErrors$,
    initialFiles,
    editorCallbacks,
    fileSystemManager,
    builderManager,
    jsonRPCLocalProviderManager,
    testRunnerManager,
    fsSubscription,
  }: MainEngineOptions) {
    this.fs = fs;
    this.output$ = output$;
    this.openFiles$ = openFiles$;
    this.createPreviewURL = createPreviewURL;
    this.dispose = dispose;
    this.id = id;
    this.buildErrors$ = buildErrors$;
    this.initialFiles = initialFiles;
    this.editorCallbacks = editorCallbacks;
    this.fileSystemManager = fileSystemManager;
    this.builderManager = builderManager;
    this.jsonRPCLocalProviderManager = jsonRPCLocalProviderManager;
    this.testRunnerManager = testRunnerManager;
    this.fsSubscription = fsSubscription;
  }

  public readonly openFile = (path: string, range?: TextRange): void => {
    this.editorCallbacks.openFile(this.getFile(path), range);
  };

  public getFile(pathIn: string): EditorFile {
    const path = normalizePath(pathIn);
    const initialFile = this.initialFiles.get(path);

    return { path, writable: initialFile === undefined ? true : initialFile.writable };
  }

  public async build(): Promise<void> {
    this.output$.next({ owner: 'neo-one', message: 'Building...' });

    await this.builderManager.withInstance(async (builder) => builder.build());
  }

  public runTests(): void {
    this.testRunnerManager
      .withInstance(async (testRunner) => testRunner.runTests())
      .catch((error) => {
        // tslint:disable-next-line no-console
        console.error(error);
      });
  }

  public runTest(path: string): void {
    this.testRunnerManager
      .withInstance(async (testRunner) => testRunner.runTest(path))
      .catch((error) => {
        // tslint:disable-next-line no-console
        console.error(error);
      });
  }

  public async registerPreviewEngine({
    onBuildError,
  }: RegisterPreviewEngineOptions): Promise<RegisterPreviewEngineResult> {
    this.fsSubscription.add(
      this.buildErrors$.pipe(switchMap(async (error) => onBuildError(error))).subscribe({
        error: (error) => {
          // tslint:disable-next-line no-console
          console.error(error);
        },
      }),
    );
    const { endpoint, dispose } = this.fileSystemManager.getEndpoint();
    this.fsSubscription.add({
      unsubscribe() {
        dispose();
      },
    });

    return {
      id: this.id,
      endpoint,
      builderManager: comlink.proxyValue(this.builderManager),
      jsonRPCLocalProviderManager: comlink.proxyValue(this.jsonRPCLocalProviderManager),
      createJSONRPCLocalProviderManager: () =>
        createMemoryJSONRPCLocalProviderManager(async () =>
          this.builderManager.withInstance((instance) => instance.build()),
        ),
      openFile: this.openFile,
    };
  }
}
