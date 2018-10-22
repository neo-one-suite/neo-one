import { FileSystem } from '@neo-one/local-browser';
import { mergeScanLatest } from '@neo-one/utils';
import fetch from 'cross-fetch';
import _ from 'lodash';
import * as path from 'path';
import { Observable, Subscription } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { Dependencies, DependencyInfo, PackageJSON, ResolvedDependencies, Resolver } from './Resolver';

interface FetchPackageInfo {
  readonly name: string;
  readonly version: string;
  readonly suffix?: string;
  readonly types?: boolean;
}

interface FileInfo {
  readonly path: string;
  readonly file: string;
}

interface Module {
  readonly name: string;
  readonly version: string;
  readonly packageFiles: ReadonlyArray<FileInfo>;
  readonly subDependencies: { readonly [name: string]: Module };
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

interface QueueData {
  readonly name: string;
  readonly version: string;
  readonly filePath: string;
  readonly resolve: (file: string) => void;
  readonly reject: (error: Error) => void;
}

export class PackageManager {
  public readonly dependencies$: Observable<ResolvedDependencies>;
  public readonly packages$: Observable<{ readonly [name: string]: Module }>;
  private readonly fs: FileSystem;
  private readonly subscription: Subscription;
  private readonly onAddTypes: (name: string, version: string, typesFullName: string) => void;
  private readonly fetchConcurrency: number;
  private readonly mutableQueue: QueueData[];
  private mutableRunning: number;

  public constructor({
    fs,
    packageJSON$,
    onAddTypes,
    fetchConcurrency = 5,
  }: {
    readonly packageJSON$: Observable<PackageJSON>;
    readonly fs: FileSystem;
    readonly onAddTypes: (name: string, version: string, typesFullName: string) => void;
    readonly fetchConcurrency?: number;
  }) {
    this.fs = fs;
    this.onAddTypes = onAddTypes;
    this.mutableQueue = [];
    this.mutableRunning = 0;
    this.fetchConcurrency = fetchConcurrency;

    this.dependencies$ = packageJSON$.pipe(
      distinctUntilChanged(),
      mergeScanLatest(async (_acc, packageJSON) =>
        this.resolveDependencies(packageJSON.dependencies === undefined ? {} : packageJSON.dependencies),
      ),
    );
    this.packages$ = this.dependencies$.pipe(mergeScanLatest(async (_acc, deps) => this.fetchPackages(deps)));
    this.subscription = this.packages$
      .pipe(map(async (packages) => this.writeModules({ packages, pkgPath: '/node_modules' })))
      .subscribe();
  }

  public dispose() {
    this.subscription.unsubscribe();
  }

  private async resolveDependencies(dependencies: Dependencies): Promise<ResolvedDependencies> {
    const resolver = new Resolver();

    return resolver.resolve(dependencies);
  }

  private async fetchPackages(deps: ResolvedDependencies) {
    const packages = await Promise.all(Object.values(deps).map(async (depInfo) => this.fetchPackage(depInfo)));

    return packages.reduce<{ readonly [name: string]: Module }>((acc, pkg) => ({ ...acc, [pkg.name]: pkg }), {});
  }

  private async fetchPackage({ name, version, types, dependencies }: DependencyInfo): Promise<Module> {
    const [packageFilePaths, subDependencies] = await Promise.all([
      this.getAllPackageFiles({ name, version }),
      this.fetchPackages(dependencies),
      this.checkTypes({ name, version, types }),
    ]);

    const packageFilePromises = packageFilePaths.map(
      async (filePath) =>
        // tslint:disable-next-line:promise-must-complete
        new Promise<string>((resolve, reject) => {
          this.mutableQueue.push({
            name,
            version,
            filePath,
            resolve,
            reject,
          });
        }),
    );
    const zippedPackageInfo = _.zip(packageFilePaths, packageFilePromises) as ReadonlyArray<[string, Promise<string>]>;

    this.startFetchLoop().catch(() => {
      // do nothing
    });

    const packageFiles = await Promise.all(
      zippedPackageInfo.map(async ([filePath, filePromise]) => {
        const file = await filePromise;

        return {
          file,
          path: filePath,
        };
      }),
    );

    return {
      name,
      version,
      packageFiles,
      subDependencies,
    };
  }

  private async getAllPackageFiles({ name, version }: FetchPackageInfo): Promise<ReadonlyArray<string>> {
    const res = await fetch(this.getNPMDataUrl({ name, version }));
    const fileTree = await res.json();

    return this.getDirectoryList({ dirList: fileTree.files });
  }

  private getDirectoryList({
    dirList,
    currentPath,
  }: {
    readonly dirList: ReadonlyArray<FileData | DirectoryData>;
    readonly currentPath?: string;
  }): ReadonlyArray<string> {
    return _.flatten(
      dirList.map((entry) => {
        if (entry.type === 'directory') {
          return this.getDirectoryList({
            dirList: entry.files,
            currentPath: currentPath === undefined ? entry.name : `${currentPath}/${entry.name}`,
          });
        }

        return currentPath === undefined ? entry.name : `${currentPath}/${entry.name}`;
      }),
    );
  }

  private async checkTypes({ name, version, types }: FetchPackageInfo) {
    if (types) {
      return;
    }

    const typesName = `@types/${name.replace('@', '').replace('/', '__')}`;
    const versionRes = await fetch(this.getNPMDataUrl({ name: typesName }));
    if (!versionRes.ok) {
      return;
    }
    const typesVersions = await versionRes.json();
    const latestTypesVersion = typesVersions.versions[0];

    const res = await fetch(this.getNPMDataUrl({ name: typesName, version: latestTypesVersion }));
    if (!res.ok) {
      return;
    }
    const files = await res.json();
    let indexFound = false;
    files.files.forEach((file: FileData | DirectoryData) => {
      if (file.name === 'index.d.ts') {
        indexFound = true;
      }
    });
    if (!indexFound) {
      return;
    }

    this.onAddTypes(name, version, `${typesName}@${latestTypesVersion}`);
  }

  private async startFetchLoop() {
    if (this.mutableRunning >= this.fetchConcurrency) {
      return;
    }

    const entry = this.mutableQueue.shift();
    // tslint:disable-next-line:no-loop-statement
    while (entry !== undefined && this.mutableRunning < this.fetchConcurrency) {
      this.mutableRunning += 1;

      this.downloadDependency({ name: entry.name, version: entry.version, suffix: entry.filePath })
        .then((file) => {
          entry.resolve(file);
          this.mutableRunning -= 1;
          this.startFetchLoop().catch(() => {
            // do nothing
          });
        })
        .catch(entry.reject);
    }
  }

  private async downloadDependency({ name, version, suffix }: FetchPackageInfo) {
    try {
      let minSuffix = suffix;
      if (suffix !== undefined && suffix.substr(-3, 3) === '.js' && suffix.substr(-7, 4) !== '.min') {
        minSuffix = suffix.replace('.js', '.min.js');
      }

      const pkg = await fetch(this.getNPMUrl({ name, version, suffix: minSuffix }));

      return pkg.text();
    } catch {
      throw new Error(`Could not find module ${name}@${version}`);
    }
  }

  private getNPMDataUrl({ name, version }: { readonly name: string; readonly version?: string }): string {
    const urlBase = `https://data.jsdelivr.com/v1/package/npm/${name}`;

    return version === undefined ? urlBase : `${urlBase}@${version}`;
  }

  private getNPMUrl({ name, version, suffix }: FetchPackageInfo): string {
    const urlBase = `https://cdn.jsdelivr.net/npm/${name}@${version}/`;

    return suffix === undefined ? urlBase : `${urlBase}/${suffix}`;
  }

  private async writeModules({
    packages,
    pkgPath,
  }: {
    readonly packages: { readonly [name: string]: Module };
    readonly pkgPath: string;
  }) {
    await Promise.all(
      Object.entries(packages).map(async ([name, pkg]) =>
        Promise.all([
          this.writeModules({
            packages: pkg.subDependencies,
            pkgPath: path.resolve(pkgPath, name, 'node_modules'),
          }),
          this.writeModule({ name, pkg, pkgPath }),
        ]),
      ),
    );
  }

  private async writeModule({
    name,
    pkg,
    pkgPath,
  }: {
    readonly name: string;
    readonly pkg: Module;
    readonly pkgPath: string;
  }) {
    await Promise.all(
      pkg.packageFiles.map(async (file) => this.fs.writeFile(path.resolve(pkgPath, name, file.path), file.file)),
    );
  }
}
