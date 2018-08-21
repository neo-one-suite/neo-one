import { DescribeTable, TaskList } from '@neo-one/server-plugin';
import { Observable } from 'rxjs';
import { ProjectResource } from './ProjectResource';
import { Project, ProjectResourceOptions, ProjectResourceType } from './ProjectResourceType';

export interface ProjectResourceAdapterInitOptions {
  readonly resourceType: ProjectResourceType;
  readonly name: string;
  readonly dataPath: string;
}

export interface ProjectResourceAdapterStaticOptions extends ProjectResourceAdapterInitOptions {}

export interface ProjectResourceAdapterOptions {
  readonly projectResource: ProjectResource;
}

export class ProjectResourceAdapter {
  public static create(
    { resourceType, name, dataPath }: ProjectResourceAdapterInitOptions,
    { rootDir }: ProjectResourceOptions,
  ): TaskList {
    return new TaskList({
      tasks: [
        {
          title: 'Create project resource',
          task: async (ctx) => {
            if (rootDir === undefined) {
              throw new Error('Root directory of the project must be defined.');
            }
            const projectResource = await ProjectResource.createNew({
              resourceType,
              name,
              dataPath,
              rootDir,
            });

            ctx.resourceAdapter = new this({ projectResource });
            await projectResource.create();
          },
        },
      ],
    });
  }

  public static async init({
    resourceType,
    name,
    dataPath,
  }: ProjectResourceAdapterInitOptions): Promise<ProjectResourceAdapter> {
    const projectResource = await ProjectResource.createExisting({
      resourceType,
      name,
      dataPath,
    });

    return new this({ projectResource });
  }

  public readonly projectResource: ProjectResource;
  public readonly resource$: Observable<Project>;

  public constructor({ projectResource }: ProjectResourceAdapterOptions) {
    this.projectResource = projectResource;

    this.resource$ = projectResource.resource$;
  }

  public async destroy(): Promise<void> {
    // do nothing
  }

  public delete(_options: ProjectResourceOptions): TaskList {
    return new TaskList({
      tasks: [
        {
          title: 'Clean up local files',
          task: async () => {
            await this.projectResource.delete();
          },
        },
      ],
    });
  }

  public start(_options: ProjectResourceOptions): TaskList {
    throw new Error('Cannot be started');
  }

  public stop(_options: ProjectResourceOptions): TaskList {
    throw new Error('Cannot be stopped');
  }

  public getDebug(): DescribeTable {
    return this.projectResource.getDebug();
  }
}
