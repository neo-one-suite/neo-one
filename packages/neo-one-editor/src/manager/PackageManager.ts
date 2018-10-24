import { FileSystem } from '@neo-one/local-browser';
import { mergeScanLatest } from '@neo-one/utils';
import _ from 'lodash';
import * as path from 'path';
import { Observable, Subscription } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { FetchQueue } from './FetchQueue';
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

export class PackageManager {
  public readonly dependencies$: Observable<ResolvedDependencies>;
  public readonly packages$: Observable<{ readonly [name: string]: Module }>;
  private readonly fs: FileSystem;
  private readonly subscription: Subscription;
  private readonly onAddTypes: (name: string, version: string, typesFullName: string) => void;
  private readonly fetchQueue: FetchQueue<string>;

  public constructor({
    fs,
    packageJSON$,
    onAddTypes,
    fetchQueue,
  }: {
    readonly packageJSON$: Observable<PackageJSON>;
    readonly fs: FileSystem;
    readonly onAddTypes: (name: string, version: string, typesFullName: string) => void;
    readonly fetchQueue: FetchQueue<string>;
  }) {
    this.fs = fs;
    this.onAddTypes = onAddTypes;
    this.fetchQueue = fetchQueue;

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
    const resolver = new Resolver({ fetchQueue: this.fetchQueue });

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

    const packageFiles = await Promise.all(
      packageFilePaths.map(async (filePath) => {
        const file = await this.downloadDependency({ name, version, suffix: filePath });

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
    // tslint:disable-next-line:promise-must-complete
    const fileTreeText = await this.fetchQueue.fetch(
      this.getNPMDataUrl({ name, version }),
      async (response: Response) => response.text(),
    );
    const fileTree = JSON.parse(fileTreeText);

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

        return currentPath === undefined ? [entry.name] : [`${currentPath}/${entry.name}`];
      }),
    );
  }

  private async checkTypes({ name, version, types }: FetchPackageInfo) {
    if (types) {
      return;
    }
    const typesName = `@types/${name.replace('@', '').replace('/', '__')}`;

    const versionRes = await this.fetchQueue.fetch(
      this.getNPMDataUrl({ name: typesName }),
      async (response: Response) => {
        if (!response.ok) {
          return 'failed';
        }

        return response.text();
      },
    );
    if (versionRes === 'failed') {
      return;
    }

    const typesVersions = JSON.parse(versionRes);
    const latestTypesVersion = typesVersions.tags.latest;

    this.onAddTypes(name, version, `${typesName}@${latestTypesVersion}`);
  }

  private async downloadDependency({ name, version, suffix }: FetchPackageInfo) {
    try {
      let minSuffix = suffix;
      if (suffix !== undefined && suffix.endsWith('.js') && !suffix.endsWith('.min.js')) {
        minSuffix = suffix.replace('.js', '.min.js');
      }

      return this.fetchQueue.fetch(this.getNPMUrl({ name, version, suffix: minSuffix }), async (response: Response) =>
        response.text(),
      );
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
