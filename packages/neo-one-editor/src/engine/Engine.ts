import { normalizePath, PouchDBFileSystem } from '@neo-one/local-browser';
import { mergeScanLatest } from '@neo-one/utils';
import { comlink } from '@neo-one/worker';
import { Subject, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { EditorFile, TextRange } from '../editor';
import { setupEditor } from '../monaco/editor';
import { EngineContentFile, EngineContentFiles, TestRunnerCallbacks } from '../types';
import { getFileType } from '../utils';
import { EngineContext } from './createEngineContext';
import { EngineBase } from './EngineBase';
import { ModuleBase } from './ModuleBase';
import { getPathWithExports } from './packages';
import { TestRunner } from './test';
import { testPackages } from './testPackages';
import { Transpiler, transpilerManager } from './transpile';
import { TranspileSignal } from './TranspileSignal';
import { RegisterPreviewEngineResult } from './types';

export interface EditorCallbacks {
  readonly openFile: (file: EditorFile, range?: TextRange) => void;
}

export interface EngineCreateOptions {
  readonly context: EngineContext;
  readonly initialFiles: EngineContentFiles;
  readonly editorCallbacks: EditorCallbacks;
  readonly testRunnerCallbacks: TestRunnerCallbacks;
}

interface EngineOptions {
  readonly context: EngineContext;
  readonly transpileSignal: TranspileSignal;
  readonly initialFiles: Map<string, EngineContentFile>;
  readonly fsSubscription: Subscription;
  readonly editorCallbacks: EditorCallbacks;
  readonly testRunnerCallbacks: TestRunnerCallbacks;
  readonly buildErrors$: Subject<string>;
}

interface RegisterPreviewEngineOptions {
  readonly onBuildError: (error: string) => Promise<void>;
}

const maybeTranspile = async (
  transpiler: Transpiler,
  transpileSignal: TranspileSignal,
  transpileCache: PouchDBFileSystem,
  pathIn: string,
  content: string,
): Promise<void> => {
  const path = normalizePath(pathIn);
  const fileType = getFileType(path);
  if ((fileType === 'typescript' || fileType === 'javascript') && !path.startsWith('/node_modules')) {
    transpileSignal.transpiling();
    try {
      const result = await transpiler.transpile(path, content);
      await transpileCache.writeFile(path, JSON.stringify(result));
    } finally {
      transpileSignal.done();
    }
  }
};

export class Engine extends EngineBase {
  public static async create({
    context,
    initialFiles,
    editorCallbacks,
    testRunnerCallbacks,
  }: EngineCreateOptions): Promise<Engine> {
    await Promise.all(
      initialFiles.map(async (file) => {
        try {
          context.fs.readFileSync(file.path);
        } catch {
          await context.fs.writeFile(file.path, file.content);
        }
      }),
    );

    const transpileSignal = new TranspileSignal();
    const buildErrors$ = new Subject<string>();
    const [fsSubscription, transpilePromises] = await transpilerManager.withInstance<
      [Subscription, Array<Promise<void>>]
    >(async (transpiler) => {
      const mutableTranspilePromises: Array<Promise<void>> = [];
      context.fs.files.forEach((file, path) => {
        mutableTranspilePromises.push(
          maybeTranspile(transpiler, transpileSignal, context.transpileCache, path, file.content),
        );
      });
      const fsSubscriptionInner = context.fs
        .bufferedChanges$()
        .pipe(
          mergeScanLatest(async (_acc, changes) => {
            try {
              await transpilerManager.withInstance(async (transpilerInner) => {
                await Promise.all(
                  changes.map(async (change) => {
                    if (change.doc === undefined) {
                      context.transpileCache.removeFile(change.id).catch((error) => {
                        // tslint:disable-next-line no-console
                        console.error(error);
                      });
                    } else {
                      await maybeTranspile(
                        transpilerInner,
                        transpileSignal,
                        context.transpileCache,
                        change.id,
                        change.doc.content,
                      );
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

    if (context.openFiles$.getValue().length === 0) {
      context.openFiles$.next(initialFiles.filter((file) => file.open).map((file) => normalizePath(file.path)));
    }
    const initialFilesMap = new Map<string, EngineContentFile>();
    initialFiles.forEach((file) => {
      initialFilesMap.set(normalizePath(file.path), file);
    });

    const engine = new Engine({
      context,
      transpileSignal,
      initialFiles: initialFilesMap,
      editorCallbacks,
      testRunnerCallbacks,
      fsSubscription,
      buildErrors$,
    });

    setupEditor({ openFile: (path: string, range?: TextRange) => engine.openFile(path, range) });

    return engine;
  }

  public readonly context: EngineContext;
  private readonly initialFiles: Map<string, EngineContentFile>;
  private readonly editorCallbacks: EditorCallbacks;
  private readonly testRunner: TestRunner;
  private readonly fsSubscription: Subscription;
  private readonly buildErrors$: Subject<string>;

  private constructor({
    context,
    transpileSignal,
    initialFiles,
    editorCallbacks,
    testRunnerCallbacks,
    fsSubscription,
    buildErrors$,
  }: EngineOptions) {
    super({
      fs: context.fs,
      transpileSignal,
      transpileCache: context.transpileCache,
      builderManager: context.builderManager,
      jsonRPCLocalProviderManager: context.jsonRPCLocalProviderManager,
      pathWithExports: getPathWithExports(
        {
          fs: context.fs,
          builderManager: context.builderManager,
          jsonRPCLocalProviderManager: context.jsonRPCLocalProviderManager,
        },
        testPackages,
      ),
    });
    this.context = context;
    this.initialFiles = initialFiles;
    this.editorCallbacks = editorCallbacks;
    this.testRunner = new TestRunner(this, testRunnerCallbacks);
    this.fsSubscription = fsSubscription;
    this.buildErrors$ = buildErrors$;
  }

  public async dispose(): Promise<void> {
    await super.dispose();
    this.fsSubscription.unsubscribe();
    await this.context.dispose();
  }

  public async build(): Promise<void> {
    this.context.output$.next({ owner: 'neo-one', message: 'Building...' });

    await this.context.builderManager.withInstance(async (builder) => builder.build());
  }

  public readonly openFile = (path: string, range?: TextRange): void => {
    this.editorCallbacks.openFile(this.getFile(path), range);
  };

  public getFile(pathIn: string): EditorFile {
    const path = normalizePath(pathIn);
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
    const { endpoint, dispose } = this.context.fileSystemManager.getEndpoint();
    this.fsSubscription.add({
      unsubscribe() {
        dispose();
      },
    });

    return {
      id: this.context.id,
      endpoint,
      builderManager: comlink.proxyValue(this.context.builderManager),
      jsonRPCLocalProviderManager: comlink.proxyValue(this.context.jsonRPCLocalProviderManager),
      openFile: this.openFile,
    };
  }
}
