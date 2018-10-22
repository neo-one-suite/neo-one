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

export class PackageManager {
  public readonly dependencies$: Observable<ResolvedDependencies>;
  public readonly packages$: Observable<{ readonly [name: string]: Module }>;
  private readonly fs: FileSystem;
  private readonly subscription: Subscription;
  private readonly typesCallback: (name: string, version: string, typesFullName: string) => Promise<void>;

  public constructor({
    fs,
    packageJSON$,
    typesCallback,
  }: {
    readonly packageJSON$: Observable<PackageJSON>;
    readonly fs: FileSystem;
    readonly typesCallback: (name: string, version: string, typesFullName: string) => Promise<void>;
  }) {
    this.fs = fs;
    this.typesCallback = typesCallback;
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

    const packageFiles = await Promise.all(
      packageFilePaths.map(async (filePath) => ({
        path: filePath,
        file: await this.downloadDependency({ name, version, suffix: filePath }),
      })),
    );

    return {
      name,
      version,
      packageFiles,
      subDependencies,
    };
  }

  private async getAllPackageFiles({ name, version, suffix }: FetchPackageInfo): Promise<ReadonlyArray<string>> {
    const rootDirList = await this.getDirectoryList({ name, version, suffix });

    const packageFiles = await Promise.all(
      rootDirList.map(async (fileOrDir: string) => {
        if (fileOrDir.includes('.') || fileOrDir === 'LICENSE') {
          return fileOrDir;
        }

        return this.getAllPackageFiles({ name, version, suffix: `${fileOrDir}/` });
      }),
    );

    return _.flatten(packageFiles);
  }

  private async getDirectoryList({ name, version, suffix }: FetchPackageInfo): Promise<ReadonlyArray<string>> {
    const res = await fetch(this.getNPMUrl({ name, version, suffix }));
    const htmlDir = await res.text();

    return htmlDir
      .split('\n')
      .filter((line) => line.includes('</a></td>'))
      .map((line) => {
        const match = line.match(/[^>\]]+(?=<)/g);

        return match === null ? '' : match[1];
      })
      .filter((line) => line !== '' && line !== '..')
      .map((line) => (suffix === undefined ? line : `${suffix}${line}`));
  }

  private async checkTypes({ name, version, types }: FetchPackageInfo) {
    if (types) {
      return;
    }
    try {
      const res = await fetch(this.getTypesUrl(name));
      const htmlDir = await res.text();
      if (!res.ok) {
        return;
      }

      const typesFullName = htmlDir
        .split('\n')
        .filter((line) => line.includes('@types') && !line.includes('>'))[0]
        .replace('\t', '')
        .trim();

      await this.typesCallback(name, version, typesFullName);
    } catch {
      return;
    }
  }

  private async downloadDependency({ name, version, suffix }: FetchPackageInfo) {
    try {
      const pkg = await fetch(this.getNPMUrl({ name, version, suffix }));

      return pkg.text();
    } catch {
      throw new Error(`Could not find module ${name}@${version}`);
    }
  }

  private getTypesUrl(name: string): string {
    const typesName = name.replace('@', '').replace('/', '__');

    return `https://cdn.jsdelivr.net/npm/@types/${typesName}`;
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
