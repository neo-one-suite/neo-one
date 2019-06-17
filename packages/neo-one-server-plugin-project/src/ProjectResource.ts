import { SourceMaps } from '@neo-one/client-common';
import { DescribeTable } from '@neo-one/server-plugin';
import * as fs from 'fs-extra';
import * as path from 'path';
import { BehaviorSubject, Observable } from 'rxjs';
import { Project, ProjectResourceType } from './ProjectResourceType';

interface ProjectResourceOptions {
  readonly resourceType: ProjectResourceType;
  readonly name: string;
  readonly rootDir: string;
  readonly sourceMaps: SourceMaps;
  readonly dataPath: string;
  readonly projectPath: string;
}

interface NewProjectResourceOptions {
  readonly resourceType: ProjectResourceType;
  readonly name: string;
  readonly rootDir: string;
  readonly sourceMaps: SourceMaps;
  readonly dataPath: string;
}

interface ExistingProjectResourceOptions {
  readonly resourceType: ProjectResourceType;
  readonly name: string;
  readonly dataPath: string;
}

const PROJECT_PATH = 'project.json';

export class ProjectResource {
  public static async createNew({
    resourceType,
    name,
    rootDir,
    sourceMaps,
    dataPath,
  }: NewProjectResourceOptions): Promise<ProjectResource> {
    const projectPath = this.getProjectPath(dataPath);

    return new ProjectResource({
      resourceType,
      name,
      rootDir,
      sourceMaps,
      dataPath,
      projectPath,
    });
  }

  public static async createExisting({
    resourceType,
    name,
    dataPath,
  }: ExistingProjectResourceOptions): Promise<ProjectResource> {
    const projectPath = this.getProjectPath(dataPath);
    const { rootDir, sourceMaps } = await fs.readJSON(projectPath);

    return new ProjectResource({
      resourceType,
      name,
      rootDir,
      sourceMaps,
      dataPath,
      projectPath,
    });
  }

  private static getProjectPath(dataPath: string): string {
    return path.resolve(dataPath, PROJECT_PATH);
  }

  public readonly resource$: Observable<Project>;
  private readonly resourceType: ProjectResourceType;
  private readonly name: string;
  private readonly rootDir: string;
  private readonly sourceMaps: SourceMaps;
  private readonly dataPath: string;
  private readonly projectPath: string;

  public constructor({ resourceType, name, rootDir, sourceMaps, dataPath, projectPath }: ProjectResourceOptions) {
    this.resourceType = resourceType;
    this.name = name;
    this.rootDir = rootDir;
    this.dataPath = dataPath;
    this.sourceMaps = sourceMaps;
    this.projectPath = projectPath;

    this.resource$ = new BehaviorSubject(this.toResource());
  }

  public async create(): Promise<void> {
    await fs.ensureDir(path.dirname(this.projectPath));
    await fs.writeJSON(this.projectPath, { rootDir: this.rootDir, sourceMaps: this.sourceMaps });
  }

  public async delete(): Promise<void> {
    await fs.remove(this.dataPath);
  }

  public getDebug(): DescribeTable {
    const table: ReadonlyArray<readonly [string, string]> = [
      ['Data Path', this.dataPath] as const,
      ['Project Path', this.projectPath] as const,
    ];

    return table.concat(
      Object.entries(this.toResource())
        .filter(([key]) => key !== 'sourceMaps')
        .map<readonly [string, string]>(([key, val]) => {
          if (val === undefined) {
            return [key, 'null'] as const;
          }

          return [key, typeof val === 'string' ? val : JSON.stringify(val, undefined, 2)] as const;
        }),
    );
  }

  private toResource(): Project {
    return {
      plugin: this.resourceType.plugin.name,
      resourceType: this.resourceType.name,
      name: this.name,
      baseName: this.name,
      state: 'started',
      rootDir: this.rootDir,
      sourceMaps: this.sourceMaps,
    };
  }
}
