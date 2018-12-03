import { Monitor } from '@neo-one/monitor';
import { retryBackoff } from '@neo-one/utils';
import fetch from 'cross-fetch';
import { Graph } from 'graphlib';
import _ from 'lodash';
import LRU from 'lru-cache';
import { defer } from 'rxjs';
import stringify from 'safe-stable-stringify';
import semver from 'semver';
import { FetchError } from './errors';
import { getEscapedName } from './utils';

const NPM_REGISTRY_URL = 'https://registry.yarnpkg.com';
const ROOT_NODE = 'root$';

export interface Dependencies {
  readonly [name: string]: string;
}

export interface PackageJSON {
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly main: string;
  readonly types?: string;
  readonly typings?: string;
  readonly dependencies?: Dependencies;
  readonly devDependencies?: Dependencies;
  readonly sideEffects?: ReadonlyArray<string>;
  readonly peerDependencies?: Dependencies;
}

export interface DependencyInfo {
  readonly name: string;
  readonly version: string;
  readonly types: boolean;
  readonly dependencies: ResolvedDependencies;
}

export interface ResolvedDependencies {
  readonly [name: string]: DependencyInfo;
}

interface RegistryPackage {
  readonly name: string;
  readonly versions?: { readonly [version: string]: PackageJSON };
}

interface Task {
  readonly name: string;
  readonly version: string;
  readonly parentNode: string;
}

const cache = new LRU<string, Promise<RegistryPackage>>({
  max: 1000,
});

// Resolves package.json to hoisted top level dependencies. Anything that can't be unambigiously hoisted is kept at the level of the package.json that required it.
class Resolver {
  private readonly graph: Graph;

  public constructor(private readonly monitor?: Monitor) {
    this.graph = new Graph();
  }

  public async resolve(dependencies: Dependencies): Promise<ResolvedDependencies> {
    const tasks = this.createTasks(dependencies, ROOT_NODE);
    const subTasks = await Promise.all(tasks.map(async (task) => this.setTopLevelDependency(task)));
    await Promise.all(_.flatten(subTasks).map(async (subTask) => this.resolveDependencies(subTask)));

    const resolvedDependencies = this.resolveDependencyGraph(ROOT_NODE);

    return resolvedDependencies === undefined ? {} : resolvedDependencies;
  }

  private async fetchRegistryPackage(name: string): Promise<RegistryPackage> {
    const escapedName = getEscapedName(name);

    const pkg = cache.get(escapedName);
    if (pkg !== undefined) {
      return pkg;
    }

    const url = `${NPM_REGISTRY_URL}/${escapedName}`;

    const result = fetch(url).then(async (res) => {
      if (!res.ok) {
        throw new FetchError(url, res.status, res.statusText);
      }

      return res.json();
    });

    cache.set(escapedName, result);

    return result;
  }

  private resolveVersion({
    requestedVersion,
    registryPackage,
  }: {
    readonly requestedVersion: string;
    readonly registryPackage: RegistryPackage;
  }): { readonly version: string; readonly versionPackageJson: PackageJSON } {
    if (registryPackage.versions === undefined) {
      throw new Error(`Could not resolve version ${requestedVersion} for ${registryPackage.name}`);
    }

    const availableVersions = Object.keys(registryPackage.versions);
    const version = semver.maxSatisfying(availableVersions, requestedVersion === '' ? '*' : requestedVersion);

    // tslint:disable-next-line strict-type-predicates
    if (version == undefined) {
      throw new Error(`Could not resolve version ${requestedVersion} for ${registryPackage.name}`);
    }

    return {
      version,
      versionPackageJson: registryPackage.versions[version],
    };
  }

  private async setTopLevelDependency(task: Task) {
    const { name, version, versionPackageJson } = await this.getDependencyData(task);

    this.graph.setNode(name, {
      name,
      version,
      types: versionPackageJson.types !== undefined || versionPackageJson.typings !== undefined,
    });
    this.graph.setEdge(ROOT_NODE, name);

    const dependencies = versionPackageJson.dependencies === undefined ? {} : versionPackageJson.dependencies;

    return this.createTasks(dependencies, task.parentNode);
  }

  private async resolveDependencies(task: Task) {
    const { name, fullName, version, versionPackageJson } = await this.getDependencyData(task);

    if (this.graph.hasNode(name)) {
      if (this.graph.node(name).version === version) {
        return;
      }
      this.graph.setNode(fullName, {
        name,
        version,
        types: versionPackageJson.types !== undefined || versionPackageJson.typings !== undefined,
      });
      this.graph.setEdge(task.parentNode, fullName);
    }
    this.graph.setNode(name, {
      name,
      version,
      types: versionPackageJson.types !== undefined || versionPackageJson.typings !== undefined,
    });
    this.graph.setEdge(ROOT_NODE, name);

    const dependencies = versionPackageJson.dependencies === undefined ? {} : versionPackageJson.dependencies;
    const subTasks = this.createTasks(dependencies, task.parentNode);
    await Promise.all(subTasks.map(async (subTask) => this.resolveDependencies(subTask)));
  }

  private resolveDependencyGraph(inNode: string): ResolvedDependencies | undefined {
    const edges = this.graph.outEdges(inNode);
    if (edges === undefined) {
      return undefined;
    }

    return edges.reduce<ResolvedDependencies>((acc, { w: node }) => {
      const nodeData = this.graph.node(node);

      return {
        ...acc,
        [nodeData.name]: {
          ...nodeData,
          dependencies: {
            ...this.resolveDependencyGraph(node),
          },
        },
      };
    }, {});
  }

  private async getDependencyData(task: Task) {
    const registryPackage = await defer(async () => this.fetchRegistryPackage(task.name))
      .pipe(
        retryBackoff({
          initialInterval: 250,
          maxRetries: 10,
          maxInterval: 2500,
          onError: (error) => {
            if (this.monitor !== undefined) {
              this.monitor.logError({
                name: 'resolve_dependencies_fetch_registry_package_error',
                error,
              });
            }
          },
        }),
      )
      .toPromise();
    const { version, versionPackageJson } = this.resolveVersion({ requestedVersion: task.version, registryPackage });

    return {
      name: registryPackage.name,
      fullName: `${registryPackage.name}@${version}`,
      version,
      versionPackageJson,
    };
  }

  private createTasks(dependencies: Dependencies, parentNode: string): ReadonlyArray<Task> {
    return Object.entries(dependencies).map(([name, version]) => ({
      name,
      version,
      parentNode,
    }));
  }
}

const resolutionCache = new LRU<string, Promise<ResolvedDependencies>>({
  max: 1000,
});

export async function resolveDependencies(
  dependencies: Dependencies,
  monitor?: Monitor,
): Promise<ResolvedDependencies> {
  const key = stringify(dependencies);
  const resolved = resolutionCache.get(key);
  if (resolved !== undefined) {
    return resolved;
  }

  const result = new Resolver(monitor).resolve(dependencies);
  result.catch((error) => {
    if (monitor !== undefined) {
      monitor.logError({
        name: 'resolve_dependencies_final_error',
        error,
      });
    }

    cache.del(key);
  });
  resolutionCache.set(key, result);

  return result;
}
