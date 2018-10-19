import { FileSystem } from '@neo-one/local-browser';
import fetch from 'cross-fetch';
import * as path from 'path';
import { Observable, Subscription } from 'rxjs';
import { distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { Dependencies, DependencyInfo, PackageJSON, ResolvedDependencies, Resolver } from './Resolver';

const PACKAGE_JSON = 'package.json';

interface FetchPackageInfo {
  readonly name: string;
  readonly version: string;
  readonly file?: string;
}

interface NMPackageInfo {
  readonly depInfo: DependencyInfo;
  readonly pkgPath: string;
}

interface Module {
  readonly name: string;
  readonly fileName: string;
  readonly version: string;
  readonly dependency: string;
  readonly packageJSON: string;
  readonly types?: string;
  readonly typeFile: string;
}

export class PackageManager {
  public readonly dependencies$: Observable<ResolvedDependencies>;
  public readonly packages$: Observable<{ readonly [name: string]: Module }>;
  private readonly fs: FileSystem;
  private readonly subscription: Subscription;

  public constructor({
    fs,
    packageJSON$,
  }: {
    readonly packageJSON$: Observable<PackageJSON>;
    readonly fs: FileSystem;
  }) {
    this.fs = fs;
    this.dependencies$ = packageJSON$.pipe(
      distinctUntilChanged(),
      switchMap(async (packageJSON) =>
        this.resolveDependencies(packageJSON.dependencies === undefined ? {} : packageJSON.dependencies),
      ),
    );
    this.packages$ = this.dependencies$.pipe(switchMap(async (deps) => this.fetchPackages(deps, 'node_modules')));
    this.subscription = this.packages$
      .pipe(map(async (packages) => this.writeModules({ packages, pkgPath: 'node_modules' })))
      .subscribe();
  }

  public cleanup() {
    this.subscription.unsubscribe();
  }

  public async resolveDependencies(dependencies: Dependencies): Promise<ResolvedDependencies> {
    const resolver = new Resolver();

    return resolver.resolve(dependencies);
  }

  private async fetchPackages(deps: ResolvedDependencies, pkgPath: string) {
    const packages = await Promise.all(
      Object.values(deps).map(async (depInfo) => this.fetchPackage({ depInfo, pkgPath })),
    );

    return packages.reduce<{ readonly [name: string]: Module }>((acc, pkg) => ({ ...acc, [pkg.name]: pkg }), {});
  }

  private async fetchPackage({ depInfo, pkgPath }: NMPackageInfo): Promise<Module> {
    let file;
    if (depInfo.main !== undefined && depInfo.main.includes('.')) {
      file = depInfo.main;
    }
    const [pkg, pkgJSON, types] = await Promise.all([
      this.downloadDependency({ name: depInfo.name, version: depInfo.version, file }),
      this.downloadDependency({ name: depInfo.name, version: depInfo.version, file: PACKAGE_JSON }),
      depInfo.types === undefined
        ? Promise.resolve(undefined)
        : this.downloadDependency({ name: depInfo.name, version: depInfo.version, file: depInfo.types }),
    ]);

    if (Object.keys(depInfo.dependencies).length !== 0) {
      const subPkgs = await this.fetchPackages(depInfo.dependencies, path.join(pkgPath, name));
      await this.writeModules({ packages: subPkgs, pkgPath: path.resolve('node_modules', name, 'node_modules') });
    }

    return {
      name: depInfo.name,
      fileName: file === undefined ? 'index.js' : file,
      version: depInfo.version,
      dependency: pkg,
      packageJSON: pkgJSON,
      types,
      typeFile: depInfo.types === undefined ? 'index.d.ts' : depInfo.types,
    };
  }

  private getNPMUrl({ name, version, file }: FetchPackageInfo): string {
    const urlBase = `https://cdn.jsdelivr.net/npm/${name}@${version}`;

    return file === undefined ? urlBase : `${urlBase}/${file}`;
  }

  private async downloadDependency({ name, version, file }: FetchPackageInfo) {
    try {
      const pkg = await fetch(this.getNPMUrl({ name, version, file }));

      return pkg.text();
      // tslint:disable-next-line no-unused
    } catch (error) {
      throw new Error(`Could not find module ${name}@${version}`);
    }
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
    await this.fs.writeFile(path.resolve(pkgPath, name, pkg.fileName), pkg.dependency);
    await this.fs.writeFile(path.resolve(pkgPath, name, 'package.json'), pkg.packageJSON);
    if (pkg.types !== undefined) {
      await this.fs.writeFile(path.resolve(pkgPath, name, pkg.typeFile), pkg.types);
    }
  }

  private async writeModules({
    packages,
    pkgPath,
  }: {
    readonly packages: { readonly [name: string]: Module };
    readonly pkgPath: string;
  }) {
    Object.entries(packages).forEach(async ([name, pkg]) => this.writeModule({ name, pkg, pkgPath }));
  }
}
