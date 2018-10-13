import {
  Builder,
  createBuilderManager,
  dirname,
  ensureDir,
  FileSystem,
  jsonRPCLocalProviderManager,
  LocalForageFileSystem,
  MemoryFileSystem,
  MirrorFileSystem,
  OutputMessage,
  pathExists,
  traverseDirectory,
} from '@neo-one/local-browser';
import { WorkerManager } from '@neo-one/worker';
import _ from 'lodash';
import * as nodePath from 'path';
import { BehaviorSubject, Subject } from 'rxjs';
import { EditorFiles } from '../editor';
import { EngineContentFiles, EngineState, TestRunnerCallbacks } from '../types';
import { EngineBase } from './EngineBase';
import { ENGINE_STATE_FILE, initializeFileSystem, INTERNAL_DIR } from './initializeFileSystem';
import { ModuleBase } from './ModuleBase';
import { packages } from './packages';
import { TestRunner } from './test';
import { transpiler } from './transpile';
import { Exports } from './types';

export interface EngineCreateOptions {
  readonly id: string;
  readonly initialFiles: EngineContentFiles;
  readonly testRunnerCallbacks: TestRunnerCallbacks;
}

interface PathWithExports {
  readonly path: string;
  readonly exports: Exports;
}

interface EngineOptions {
  readonly id: string;
  readonly output$: Subject<OutputMessage>;
  readonly builderManager: WorkerManager<typeof Builder>;
  readonly fs: FileSystem;
  readonly pathWithExports: ReadonlyArray<PathWithExports>;
  readonly testRunnerCallbacks: TestRunnerCallbacks;
}

export class Engine extends EngineBase {
  public static async create({ id, initialFiles, testRunnerCallbacks }: EngineCreateOptions): Promise<Engine> {
    const output$ = new Subject<OutputMessage>();
    const builderManager = createBuilderManager(output$, id, jsonRPCLocalProviderManager);
    const [fs, builderInstance, jsonRPCLocalProvider] = await Promise.all([
      MirrorFileSystem.create(new MemoryFileSystem(), new LocalForageFileSystem(id)),
      builderManager.getInstance(),
      jsonRPCLocalProviderManager.getInstance(),
    ]);

    fs.subscribe((change) => {
      builderInstance.onFileSystemChange(change).catch((error) => {
        // tslint:disable-next-line no-console
        console.error(error);
      });
    });

    const exists = pathExists(fs, ENGINE_STATE_FILE);
    let state: EngineState;
    if (exists) {
      const stateContents = fs.readFileSync(ENGINE_STATE_FILE);
      state = JSON.parse(stateContents);
    } else {
      initializeFileSystem(fs);
      state = {
        openFiles: initialFiles.filter((file) => file.open).map((file) => file.path),
      };
      fs.writeFileSync(ENGINE_STATE_FILE, JSON.stringify(state));
    }

    const pathWithExports = packages.reduce<ReadonlyArray<PathWithExports>>(
      (acc, { path, exports }) =>
        acc.concat({
          path,
          exports: exports({ fs, jsonRPCLocalProvider, builder: builderInstance }),
        }),
      [],
    );

    const engine = new Engine({ id, output$, builderManager, fs, pathWithExports, testRunnerCallbacks });

    if (!exists) {
      initialFiles.forEach((file) => {
        ensureDir(engine.fs, nodePath.dirname(file.path));
        engine.fs.writeFileSync(file.path, file.content, { writable: file.writable });
      });

      // Need to synchronize here so that when we start up the language workers they have an up to date filesystem
      // Can/should be removed once we reduce the size of the initial file system.
      await fs.sync();
    }

    state.openFiles.forEach((file) => {
      engine.openFile(file);
    });

    return engine;
  }

  public readonly openFiles$: BehaviorSubject<EditorFiles>;
  public readonly files$: BehaviorSubject<EditorFiles>;
  private readonly testRunner: TestRunner;
  private readonly builderManager: WorkerManager<typeof Builder>;

  private constructor({ id, output$, fs, builderManager, pathWithExports, testRunnerCallbacks }: EngineOptions) {
    super({ id, output$, fs, transpiler, pathWithExports });
    this.openFiles$ = new BehaviorSubject<EditorFiles>([]);
    this.files$ = new BehaviorSubject<EditorFiles>(
      [...traverseDirectory(fs, '/')]
        .filter((path) => !path.startsWith(INTERNAL_DIR))
        .map((path) => this.getFile(path)),
    );
    this.testRunner = new TestRunner(this, testRunnerCallbacks);
    this.builderManager = builderManager;

    this.fs.subscribe((event) => {
      switch (event.type) {
        case 'writeFile':
          this.files$.next(
            _.uniqBy(this.files$.getValue().concat([this.getFile(event.path)]), ({ path: filePath }) => filePath),
          );
          break;
        default:
        // do nothing
      }
    });
  }

  public openFile(path: string): void {
    this.openFiles$.next(
      _.uniqBy(this.openFiles$.getValue().concat([this.getFile(path)]), ({ path: filePath }) => filePath),
    );
  }

  public async build(): Promise<void> {
    const builder = await this.builderManager.getInstance();
    const result = await builder.build();

    result.files.forEach((file) => {
      ensureDir(this.fs, dirname(file.path));
      this.fs.writeFileSync(file.path, file.content, { writable: true });
    });
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
}
