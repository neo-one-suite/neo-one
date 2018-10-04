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
  normalizePath,
  OutputMessage,
  pathExists,
  traverseDirectory,
} from '@neo-one/local-browser';
import { WorkerManager } from '@neo-one/worker';
import * as nodePath from 'path';
import { BehaviorSubject, Subject } from 'rxjs';
import { EditorFiles } from '../editor';
import { ModuleNotFoundError } from '../errors';
import { EngineContentFiles, FileMetadata, FileSystemMetadata, TestRunnerCallbacks } from '../types';
import { getFileType } from '../utils';
import { EMPTY_MODULE_PATH, initializeFileSystem, METADATA_FILE, TRANSPILE_PATH } from './initializeFileSystem';
import { ModuleBase } from './ModuleBase';
import { packages } from './packages';
import { resolve } from './resolve';
import { StaticExportsModule } from './StaticExportsModule';
import { TestRunner } from './test';
import { TranspiledModule, Transpiler, TranspilerWorker } from './transpile';
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
  readonly builder: WorkerManager<typeof Builder>;
  readonly fs: FileSystem;
  readonly files: EditorFiles;
  readonly pathWithExports: ReadonlyArray<PathWithExports>;
  readonly testRunnerCallbacks: TestRunnerCallbacks;
}

interface Modules {
  // tslint:disable-next-line readonly-keyword
  [path: string]: ModuleBase;
}

const BUILTIN_MODULES = new Set(['path']);

export class Engine {
  public static async create({ id, initialFiles, testRunnerCallbacks }: EngineCreateOptions): Promise<Engine> {
    const output$ = new Subject<OutputMessage>();
    const builder = createBuilderManager(output$, id);
    const [fs, builderInstance, jsonRPCLocalProvider] = await Promise.all([
      MirrorFileSystem.create(new MemoryFileSystem(), new LocalForageFileSystem(id)),
      builder.getInstance(),
      jsonRPCLocalProviderManager.getInstance(),
    ]);

    fs.subscribe((change) => {
      builderInstance.onFileSystemChange(change).catch((error) => {
        // tslint:disable-next-line no-console
        console.error(error);
      });
    });

    const exists = pathExists(fs, METADATA_FILE);
    let metadata: FileSystemMetadata;
    if (exists) {
      const metadataContents = fs.readFileSync(METADATA_FILE);
      metadata = JSON.parse(metadataContents);
    } else {
      initializeFileSystem(fs);
      metadata = {
        fileMetadata: initialFiles.reduce<FileSystemMetadata['fileMetadata']>(
          (acc, file) => ({
            ...acc,
            [file.path]: { writable: file.writable },
          }),
          {},
        ),
        files: initialFiles.filter((file) => file.open).map((file) => file.path),
      };
      fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata));
    }

    const files = metadata.files.map((file) => {
      const fileMetadata = metadata.fileMetadata[file] as FileMetadata | undefined;

      return {
        path: file,
        writable: fileMetadata === undefined ? true : fileMetadata.writable,
      };
    });

    const pathWithExports = packages.reduce<ReadonlyArray<PathWithExports>>(
      (acc, { path, exports }) =>
        acc.concat({
          path,
          exports: exports({ fs, jsonRPCLocalProvider, builder: builderInstance }),
        }),
      [],
    );

    const engine = new Engine({ id, output$, builder, fs, files, pathWithExports, testRunnerCallbacks });

    if (!exists) {
      initialFiles.forEach((file) => {
        engine.writeFileSync(file.path, file.content);
      });

      // Need to synchronize here so that when we start up the language workers they have an up to date filesystem
      await fs.sync();
    }

    return engine;
  }

  public readonly id: string;
  public readonly output$: Subject<OutputMessage>;
  public readonly fs: FileSystem;
  public readonly openFiles$: BehaviorSubject<EditorFiles>;
  public readonly transpiler: WorkerManager<typeof Transpiler>;
  private readonly testRunner: TestRunner;
  private readonly builder: WorkerManager<typeof Builder>;
  private readonly mutableModules: Modules;
  // tslint:disable-next-line readonly-keyword
  private readonly mutableCachedPaths: { [currentPath: string]: { [path: string]: string } } = {};

  private constructor({ id, output$, fs, builder, files, pathWithExports, testRunnerCallbacks }: EngineOptions) {
    this.id = id;
    this.output$ = output$;
    this.fs = fs;
    this.openFiles$ = new BehaviorSubject(files);
    this.testRunner = new TestRunner(this, testRunnerCallbacks);
    this.builder = builder;
    this.transpiler = new WorkerManager<typeof Transpiler>(TranspilerWorker, new BehaviorSubject<{}>({}));
    this.mutableModules = pathWithExports.reduce<Modules>(
      (acc, { path, exports }) => ({
        ...acc,
        [path]: new StaticExportsModule(this, path, exports),
      }),
      {
        path: new StaticExportsModule(this, 'path', nodePath),
      },
    );
    this.loadTranspiledModules();
  }

  public get modules(): { readonly [path: string]: ModuleBase } {
    return this.mutableModules;
  }

  public writeFileSync(path: string, content: string): void {
    ensureDir(this.fs, dirname(path));
    this.fs.writeFileSync(path, content);
    if (getFileType(path) === 'typescript') {
      this.transpileModule(path);
    }
  }

  public async build(): Promise<void> {
    const instance = await this.builder.getInstance();
    const result = await instance.build();

    result.files.forEach((file) => {
      ensureDir(this.fs, dirname(file.path));
      this.writeFileSync(file.path, file.content);
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

  public getTranspiledPath(path: string): string {
    return nodePath.join(TRANSPILE_PATH, path);
  }

  public getGlobals(mod: ModuleBase) {
    return {
      ...this.testRunner.getTestGlobals(mod),
      __dirname: dirname(mod.path),
      __filename: mod.path,
    };
  }

  public resolveModule(path: string, currentPath: string): ModuleBase {
    if (BUILTIN_MODULES.has(path)) {
      return this.getModule(path, true);
    }

    const currentDir = dirname(currentPath);
    if ((this.mutableCachedPaths[currentDir] as { [path: string]: string } | undefined) === undefined) {
      this.mutableCachedPaths[currentDir] = {};
    }

    let resolvedPath = this.mutableCachedPaths[currentDir][path] as string | undefined;
    if (resolvedPath === undefined) {
      resolvedPath = resolve({ module: path, from: currentPath, emptyModulePath: EMPTY_MODULE_PATH, fs: this.fs });
      this.mutableCachedPaths[currentDir][path] = resolvedPath;
    }

    return this.getModule(resolvedPath);
  }

  private getModule(pathIn: string, normalized = false): ModuleBase {
    const path = normalized ? pathIn : normalizePath(pathIn);
    const mod = this.mutableModules[path] as ModuleBase | undefined;
    if (mod === undefined) {
      throw new ModuleNotFoundError(path);
    }

    return mod;
  }

  private transpileModule(pathIn: string): TranspiledModule {
    const path = normalizePath(pathIn);
    const mod = this.mutableModules[path] as ModuleBase | undefined;
    let transpiledModule = mod !== undefined && mod instanceof TranspiledModule ? mod : undefined;
    if (transpiledModule === undefined) {
      transpiledModule = new TranspiledModule(this, path);
      this.mutableModules[path] = transpiledModule;
    }

    transpiledModule.transpile();

    return transpiledModule;
  }

  private loadTranspiledModules(): void {
    const files = [...traverseDirectory(this.fs, TRANSPILE_PATH)];
    files.forEach((file) => {
      const path = file.path.slice(TRANSPILE_PATH.length);
      const mod = new TranspiledModule(this, path, file.content);
      // Re-transpile in case it has changed.
      mod.transpile();
      this.mutableModules[path] = mod;
    });
  }
}
