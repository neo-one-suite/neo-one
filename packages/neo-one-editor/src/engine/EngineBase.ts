import { Builder, dirname, normalizePath, PouchDBFileSystem } from '@neo-one/local-browser';
import { JSONRPCLocalProvider } from '@neo-one/node-browser';
import { WorkerManager } from '@neo-one/worker';
import * as bignumber from 'bignumber.js';
import * as nodePath from 'path';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as reakit from 'reakit';
import * as rxjs from 'rxjs';
import * as rxjsOperators from 'rxjs/operators';
import * as styledComponents from 'styled-components';
import { ModuleNotFoundError } from '../errors';
import { ModuleBase } from './ModuleBase';
import { getPathWithExports, PathWithExports } from './packages';
import { resolve } from './resolve';
import { StaticExportsModule } from './StaticExportsModule';
import { TranspiledModule } from './TranspiledModule';
import { TranspileSignal } from './TranspileSignal';

interface EngineBaseOptions {
  readonly fs: PouchDBFileSystem;
  readonly transpileSignal?: TranspileSignal;
  readonly transpileCache: PouchDBFileSystem;
  readonly jsonRPCLocalProviderManager: WorkerManager<typeof JSONRPCLocalProvider>;
  readonly builderManager: WorkerManager<typeof Builder>;
  readonly pathWithExports?: ReadonlyArray<PathWithExports>;
}

type Modules = Map<string, ModuleBase>;

const EMPTY_MODULE_PATH = '$empty';

export class EngineBase {
  protected readonly mutableModules: Modules;
  protected readonly fs: PouchDBFileSystem;
  private readonly transpileSignal: TranspileSignal;
  private readonly subscription: rxjs.Subscription;
  // tslint:disable-next-line readonly-keyword
  private readonly mutableCachedPaths: { [currentPath: string]: { [path: string]: string } } = {};

  public constructor({
    fs,
    transpileSignal = new TranspileSignal(),
    transpileCache,
    builderManager,
    jsonRPCLocalProviderManager,
    pathWithExports: pathWithExportsIn = [],
  }: EngineBaseOptions) {
    this.fs = fs;
    this.transpileSignal = transpileSignal;
    const pathWithExports = getPathWithExports({ fs, builderManager, jsonRPCLocalProviderManager }).concat(
      pathWithExportsIn,
    );
    this.mutableModules = new Map([
      [EMPTY_MODULE_PATH, new StaticExportsModule(this, EMPTY_MODULE_PATH, {})],
      ['path', new StaticExportsModule(this, 'path', nodePath)],
      ['react', new StaticExportsModule(this, 'react', React)],
      ['reakit', new StaticExportsModule(this, 'reakit', reakit)],
      ['rxjs', new StaticExportsModule(this, 'rxjs', rxjs)],
      ['rxjs/operators', new StaticExportsModule(this, 'rxjs/operators', rxjsOperators)],
      ['styled-components', new StaticExportsModule(this, 'styled-components', styledComponents)],
      ['react-dom', new StaticExportsModule(this, 'react-dom', ReactDOM)],
      ['bignumber.js', new StaticExportsModule(this, 'bignumber.js', bignumber)],
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
        rxjsOperators.map((change) => {
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
  }

  public async dispose(): Promise<void> {
    this.subscription.unsubscribe();
  }

  public async waitTranspile(): Promise<void> {
    return this.transpileSignal.wait();
  }

  public get modules(): Map<string, ModuleBase> {
    return this.mutableModules;
  }

  public getGlobals(mod: ModuleBase) {
    return {
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

  public tryGetModule(pathIn: string, normalized = false): ModuleBase | undefined {
    const path = normalized ? pathIn : normalizePath(pathIn);

    return this.mutableModules.get(path);
  }

  private getModule(path: string, normalized = false): ModuleBase {
    const mod = this.tryGetModule(path, normalized);
    if (mod === undefined) {
      throw new ModuleNotFoundError(path);
    }

    return mod;
  }
}
