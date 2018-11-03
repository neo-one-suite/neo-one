import { Builder, dirname, normalizePath, PouchDBFileSystem } from '@neo-one/local-browser';
import { JSONRPCLocalProvider } from '@neo-one/node-browser';
import { retryBackoff } from '@neo-one/utils';
import { WorkerManager } from '@neo-one/worker';
import fetch from 'cross-fetch';
import _ from 'lodash';
import * as nodePath from 'path';
import { defer, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { TrackJS } from 'trackjs';
import { ModuleNotFoundError } from '../../errors';
import { MissingPath, ModuleBase } from './ModuleBase';
import { getPathWithExports, PathWithExports } from './packages';
import { getNodeModulesPaths, resolve } from './resolve';
import { StaticExportsModule } from './StaticExportsModule';
import { TranspiledModule } from './TranspiledModule';
import { Globals } from './types';

interface RemoteEngineOptions {
  readonly fs: PouchDBFileSystem;
  readonly transpileCache: PouchDBFileSystem;
  readonly jsonRPCLocalProviderManager: WorkerManager<typeof JSONRPCLocalProvider>;
  readonly createJSONRPCLocalProviderManager: () => Promise<WorkerManager<typeof JSONRPCLocalProvider>>;
  readonly builderManager: WorkerManager<typeof Builder>;
  readonly pathWithExports?: ReadonlyArray<PathWithExports>;
  readonly globals?: Globals;
}

interface DirectoryData {
  readonly type: 'directory';
  readonly name: string;
  readonly files: ReadonlyArray<FileData | DirectoryData>;
}

interface FileData {
  readonly type: 'file';
  readonly name: string;
  readonly hash: string;
  readonly time: string;
  readonly size: number;
}

interface FileTree {
  readonly files: ReadonlyArray<FileData | DirectoryData>;
}

interface PackageJSON {
  readonly name: string;
  readonly version: string;
}

type Modules = Map<string, ModuleBase>;

const EMPTY_MODULE_PATH = '$empty';

const fileTreeCache = new Map<string, Promise<FileTree>>();
const fileCache = new Map<string, Promise<string>>();

export class RemoteEngine {
  protected readonly mutableModules: Modules;
  protected readonly fs: PouchDBFileSystem;
  private readonly subscription: Subscription;
  // tslint:disable-next-line readonly-keyword
  private readonly mutableCachedPaths: { [currentPath: string]: { [path: string]: string } } = {};
  private readonly globals: Globals;

  public constructor({
    fs,
    transpileCache,
    builderManager,
    jsonRPCLocalProviderManager,
    createJSONRPCLocalProviderManager,
    pathWithExports: pathWithExportsIn = [],
    globals = {},
  }: RemoteEngineOptions) {
    this.fs = fs;
    const pathWithExports = getPathWithExports({
      fs,
      builderManager,
      jsonRPCLocalProviderManager,
      createJSONRPCLocalProviderManager,
    }).concat(pathWithExportsIn);
    this.mutableModules = new Map([
      [EMPTY_MODULE_PATH, new StaticExportsModule(this, EMPTY_MODULE_PATH, {})],
      ['path', new StaticExportsModule(this, 'path', nodePath)],
    ]);
    // tslint:disable-next-line no-loop-statement
    for (const { name, exports } of pathWithExports) {
      this.mutableModules.set(name, new StaticExportsModule(this, name, exports));
    }

    transpileCache.files.forEach((file, path) => {
      const { code, sourceMap } = JSON.parse(file.content);
      this.mutableModules.set(path, new TranspiledModule(this, path, code, sourceMap));
    });

    this.subscription = transpileCache.changes$
      .pipe(
        map((change) => {
          if (change.doc === undefined) {
            this.mutableModules.delete(change.id);
          } else {
            const current = this.mutableModules.get(change.id);
            if (current !== undefined && current instanceof TranspiledModule) {
              current.clearExports();
            }
            const { code, sourceMap } = JSON.parse(change.doc.content);
            this.mutableModules.set(change.id, new TranspiledModule(this, change.id, code, sourceMap));
          }
        }),
      )
      .subscribe();
    this.globals = globals;
  }

  public async dispose(): Promise<void> {
    this.subscription.unsubscribe();
  }

  public get modules(): Map<string, ModuleBase> {
    return this.mutableModules;
  }

  public getGlobals(mod: ModuleBase) {
    return {
      ...this.globals,
      __dirname: dirname(mod.path),
      __filename: mod.path,
      process: {
        env: {
          NODE_ENV: 'development',
        },
      },
    };
  }

  public resolveModule(path: string, currentPath: string): ModuleBase {
    if (!path.startsWith('.') && !path.startsWith('/')) {
      const mod = this.tryGetModule(path, true);
      if (mod !== undefined) {
        return mod;
      }
    }

    const currentDir = dirname(currentPath);
    if ((this.mutableCachedPaths[currentDir] as { [path: string]: string } | undefined) === undefined) {
      this.mutableCachedPaths[currentDir] = {};
    }

    let resolvedPath = this.mutableCachedPaths[currentDir][path] as string | undefined;
    if (resolvedPath === undefined) {
      try {
        resolvedPath = resolve({ module: path, from: currentPath, emptyModulePath: EMPTY_MODULE_PATH, fs: this.fs });
        this.mutableCachedPaths[currentDir][path] = resolvedPath;
      } catch {
        throw new ModuleNotFoundError(path);
      }
    }

    return this.getModule(resolvedPath);
  }

  public tryGetModule(pathIn: string, normalized = false): ModuleBase | undefined {
    const path = normalized ? pathIn : normalizePath(pathIn);

    let mod = this.mutableModules.get(path);
    if (mod === undefined && path.startsWith('/node_modules')) {
      try {
        const code = this.fs.readFileSync(path);
        mod = new TranspiledModule(this, path, code);
        this.mutableModules.set(path, mod);
      } catch {
        // do nothing
      }
    }

    return mod;
  }

  public async fetchDependencies(paths: ReadonlyArray<MissingPath>): Promise<void> {
    try {
      await Promise.all(paths.map(async (path) => this.fetchDependency(path)));
    } catch (error) {
      TrackJS.track(error);
    }
  }

  private getModule(path: string, normalized = false): ModuleBase {
    const mod = this.tryGetModule(path, normalized);
    if (mod === undefined) {
      throw new ModuleNotFoundError(path);
    }

    return mod;
  }

  private async fetchDependency(path: MissingPath): Promise<void> {
    const result = this.findPackageJSON(path);
    if (result === undefined) {
      return;
    }

    const { packageJSONPath, packageJSON } = result;
    const fileTree = await this.getFileTree(packageJSON);
    const modulePath = nodePath.dirname(packageJSONPath);
    const files = new Set(this.processFileTree(fileTree.files).map((file) => nodePath.resolve(modulePath, file)));
    let resolvedPath: string;
    try {
      resolvedPath = resolve({
        module: path.request,
        from: path.currentPath,
        emptyModulePath: EMPTY_MODULE_PATH,
        fs: this.fs,
        files,
      });
    } catch {
      // do nothing, the error will be thrown once we go through the resolve loop again
      return;
    }

    const relativePath = nodePath.relative(modulePath, resolvedPath);
    const text = await this.getDepFile(packageJSON, relativePath);
    await this.fs.writeFile(resolvedPath, text);
  }

  private findPackageJSON({
    request,
    currentPath,
  }: MissingPath):
    | {
        readonly packageJSONPath: string;
        readonly packageJSON: PackageJSON;
      }
    | undefined {
    const nodeModulesDirs = getNodeModulesPaths(nodePath.dirname(currentPath));
    let packageJSONPaths: ReadonlyArray<string>;
    if (request.startsWith('.')) {
      packageJSONPaths = nodeModulesDirs
        .map((path) => nodePath.resolve(path.slice(0, -'node_modules'.length), 'package.json'))
        // Don't include the root /package.json
        .slice(0, -1);
    } else {
      const moduleName = request.split('/')[0];
      packageJSONPaths = nodeModulesDirs.map((path) => nodePath.resolve(path, moduleName, 'package.json'));
    }

    // tslint:disable-next-line no-loop-statement
    for (const packageJSONPath of packageJSONPaths) {
      try {
        const packageJSONContents = this.fs.readFileSync(packageJSONPath);

        return { packageJSONPath, packageJSON: JSON.parse(packageJSONContents) };
      } catch {
        // do nothing
      }
    }

    return undefined;
  }

  private processFileTree(files: ReadonlyArray<DirectoryData | FileData>, currentPath?: string): ReadonlyArray<string> {
    return _.flatten(
      files.map((entry) => {
        if (entry.type === 'directory') {
          return this.processFileTree(
            entry.files,
            currentPath === undefined ? entry.name : `${currentPath}/${entry.name}`,
          );
        }

        return currentPath === undefined ? [entry.name] : [`${currentPath}/${entry.name}`];
      }),
    );
  }

  private async getFileTree(packageJSON: PackageJSON): Promise<FileTree> {
    const key = `${packageJSON.name}@${packageJSON.version}`;
    const fileTree = fileTreeCache.get(key);
    if (fileTree !== undefined) {
      return fileTree;
    }

    const result = this.fetch(
      `https://data.jsdelivr.com/v1/package/npm/${packageJSON.name}@${packageJSON.version}`,
    ).then(async (response) => response.json());
    fileTreeCache.set(key, result);

    return result;
  }

  private async getDepFile(packageJSON: PackageJSON, relativePath: string): Promise<string> {
    const key = `${packageJSON.name}@${packageJSON.version}/${relativePath}`;
    const file = fileCache.get(key);
    if (file !== undefined) {
      return file;
    }

    const result = this.fetch(
      `https://cdn.jsdelivr.net/npm/${packageJSON.name}@${packageJSON.version}/${relativePath}`,
    ).then(async (response) => response.text());
    fileCache.set(key, result);

    return result;
  }

  private async fetch(url: string): Promise<Response> {
    const response = await defer(async () => fetch(url, { mode: 'no-cors' }))
      .pipe(
        retryBackoff({
          initialInterval: 250,
          maxRetries: 10,
          maxInterval: 2500,
        }),
      )
      .toPromise();
    if (!response.ok) {
      throw new Error(`Failed to fetch file at ${url} with status ${response.status}: ${response.statusText}`);
    }

    return response;
  }
}
