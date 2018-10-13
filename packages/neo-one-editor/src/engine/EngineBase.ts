import { dirname, FileSystem, normalizePath, OutputMessage, traverseDirectory } from '@neo-one/local-browser';
import { WorkerManager } from '@neo-one/worker';
import * as bignumber from 'bignumber.js';
import * as nodePath from 'path';
import { Subject } from 'rxjs';
import { EditorFile } from '../editor';
import { ModuleNotFoundError } from '../errors';
import { getFileType } from '../utils';
import { EMPTY_MODULE_PATH, TRANSPILE_PATH } from './initializeFileSystem';
import { ModuleBase } from './ModuleBase';
import { resolve } from './resolve';
import { StaticExportsModule } from './StaticExportsModule';
import { TranspiledModule, Transpiler } from './transpile';
import { Exports } from './types';

interface PathWithExports {
  readonly path: string;
  readonly exports: Exports;
}

interface EngineBaseOptions {
  readonly id: string;
  readonly output$: Subject<OutputMessage>;
  readonly fs: FileSystem;
  readonly pathWithExports: ReadonlyArray<PathWithExports>;
  readonly transpiler: WorkerManager<typeof Transpiler>;
}

interface Modules {
  // tslint:disable-next-line readonly-keyword
  [path: string]: ModuleBase;
}

const BUILTIN_MODULES = new Set(['path', 'bignumber.js']);

export class EngineBase {
  public readonly id: string;
  public readonly output$: Subject<OutputMessage>;
  public readonly fs: FileSystem;
  public readonly transpiler: WorkerManager<typeof Transpiler>;
  private readonly mutableModules: Modules;
  // tslint:disable-next-line readonly-keyword
  private readonly mutableCachedPaths: { [currentPath: string]: { [path: string]: string } } = {};

  public constructor({ id, output$, fs, transpiler, pathWithExports }: EngineBaseOptions) {
    this.id = id;
    this.output$ = output$;
    this.fs = fs;
    this.transpiler = transpiler;
    this.mutableModules = pathWithExports.reduce<Modules>(
      (acc, { path, exports }) => ({
        ...acc,
        [path]: new StaticExportsModule(this, path, exports),
      }),
      {
        path: new StaticExportsModule(this, 'path', nodePath),
        'bignumber.js': new StaticExportsModule(this, 'bignumber.js', bignumber),
      },
    );
    this.loadTranspiledModules();
  }

  public dispose(): void {
    // do nothing
  }

  public get modules(): { readonly [path: string]: ModuleBase } {
    return this.mutableModules;
  }

  public getFile(path: string): EditorFile {
    const { writable } = this.fs.readFileOptsSync(path);

    return { path, writable };
  }

  public getTranspiledPath(path: string): string {
    return nodePath.join(TRANSPILE_PATH, path);
  }

  public getGlobals(mod: ModuleBase) {
    return {
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

  private readonly onWriteFile = (pathIn: string): void => {
    const path = normalizePath(pathIn);
    if (getFileType(path) === 'typescript' && !path.startsWith(TRANSPILE_PATH)) {
      this.transpileModule(path);
    }
  };

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
    const paths = [...traverseDirectory(this.fs, TRANSPILE_PATH)];
    paths.forEach((filePath) => {
      const path = filePath.slice(TRANSPILE_PATH.length);
      const content = this.fs.readFileSync(filePath);
      const mod = new TranspiledModule(this, path, content);
      // Re-transpile in case it has changed.
      mod.transpile();
      this.mutableModules[path] = mod;
    });
    this.fs.subscribe((event) => {
      switch (event.type) {
        case 'writeFile':
          this.onWriteFile(event.path);
          break;
        default:
        // do nothing
      }
    });
  }
}
