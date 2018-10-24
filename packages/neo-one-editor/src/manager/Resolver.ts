import { Graph } from 'graphlib';
import _ from 'lodash';
import npa from 'npm-package-arg';
import semver from 'semver';
import { FetchQueue } from './FetchQueue';

const NPM_REGISTRY_URL = 'https://registry.npmjs.org';
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

// Resolves package.json to hoisted top level dependencies. Anything that can't be unambigiously hoisted is kept at the level of the package.json that required it.
export class Resolver {
  private readonly graph: Graph;
  private readonly fetchQueue: FetchQueue<string>;

  public constructor({ fetchQueue }: { readonly fetchQueue: FetchQueue<string> }) {
    this.graph = new Graph();
    this.fetchQueue = fetchQueue;
  }

  public async resolve(dependencies: Dependencies): Promise<ResolvedDependencies> {
    const tasks = this.createTasks(dependencies, ROOT_NODE);
    const subTasks = await Promise.all(tasks.map(async (task) => this.setTopLevelDependency(task)));
    await Promise.all(_.flatten(subTasks).map(async (subTask) => this.resolveDependencies(subTask)));

    const resolvedDependencies = this.resolveDependencyGraph(ROOT_NODE);

    return resolvedDependencies === undefined ? {} : resolvedDependencies;
  }

  private async fetchRegistryPackage(name: string): Promise<RegistryPackage> {
    const escapedName = name && npa(name).escapedName;

    try {
      const res = await this.fetchQueue.fetch(`${NPM_REGISTRY_URL}/${escapedName}`, async (response: Response) =>
        response.text(),
      );

      return JSON.parse(res);
    } catch (error) {
      throw new Error(`Failed to fetch ${name} from npm registry. ${error}`);
    }
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
    const registryPackage = await this.fetchRegistryPackage(task.name);
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
