import { SourceMaps } from '@neo-one/client-common';
import {
  CRUD,
  DescribeTable,
  ListTable,
  MasterResourceAdapter,
  MasterResourceAdapterOptions,
  ResourceState,
  ResourceType,
} from '@neo-one/server-plugin';
import _ from 'lodash';
import { MasterProjectResourceAdapter } from './MasterProjectResourceAdapter';
import { ProjectPlugin } from './ProjectPlugin';

export interface Coin {
  readonly assetName: string;
  readonly asset: string;
  readonly amount: string;
}

export interface Project {
  readonly plugin: string;
  readonly resourceType: string;
  readonly name: string;
  readonly baseName: string;
  readonly state: ResourceState;
  readonly rootDir: string;
  readonly sourceMaps: SourceMaps;
}

export interface ProjectResourceOptions {
  readonly rootDir?: string;
  readonly sourceMaps?: SourceMaps;
}

export class ProjectResourceType extends ResourceType<Project, ProjectResourceOptions> {
  public constructor({ plugin }: { readonly plugin: ProjectPlugin }) {
    super({
      plugin,
      name: 'project',
      names: {
        capital: 'Project',
        capitalPlural: 'Projects',
        lower: 'project',
        lowerPlural: 'projects',
      },
    });
  }

  public async createMasterResourceAdapter(
    _options: MasterResourceAdapterOptions,
  ): Promise<MasterResourceAdapter<Project, ProjectResourceOptions>> {
    return new MasterProjectResourceAdapter({ resourceType: this });
  }

  public getCRUD(): CRUD<Project, ProjectResourceOptions> {
    return new CRUD({ resourceType: this });
  }

  public getListTable(resources: readonly Project[]): ListTable {
    return [['ID', 'Root Directory', 'Address', 'Unlocked', 'NEO', 'GAS']].concat(
      _.sortBy(resources, (resource) => resource.name).map((resource) => [resource.name, resource.rootDir]),
    );
  }

  public getDescribeTable(resource: Project): DescribeTable {
    return [['ID', resource.baseName], ['Root Directory', resource.rootDir]];
  }
}
