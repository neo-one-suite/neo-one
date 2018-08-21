import { ResourceAdapter, ResourceAdapterOptions, TaskList } from '@neo-one/server-plugin';
import { ProjectResourceAdapter, ProjectResourceAdapterInitOptions } from './ProjectResourceAdapter';
import { Project, ProjectResourceOptions, ProjectResourceType } from './ProjectResourceType';

export class MasterProjectResourceAdapter {
  private readonly resourceType: ProjectResourceType;

  public constructor({ resourceType }: { readonly resourceType: ProjectResourceType }) {
    this.resourceType = resourceType;
  }

  public async initResourceAdapter(
    options: ResourceAdapterOptions,
  ): Promise<ResourceAdapter<Project, ProjectResourceOptions>> {
    return ProjectResourceAdapter.init(this.getResourceAdapterOptions(options));
  }

  public createResourceAdapter(adapterOptions: ResourceAdapterOptions, options: ProjectResourceOptions): TaskList {
    return ProjectResourceAdapter.create(this.getResourceAdapterOptions(adapterOptions), options);
  }

  private getResourceAdapterOptions(options: ResourceAdapterOptions): ProjectResourceAdapterInitOptions {
    return {
      name: options.name,
      dataPath: options.dataPath,
      resourceType: this.resourceType,
    };
  }
}
