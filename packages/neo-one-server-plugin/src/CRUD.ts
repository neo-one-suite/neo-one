import { CreateCRUD } from './CreateCRUD';
import { DeleteCRUD } from './DeleteCRUD';
import { DescribeCRUD } from './DescribeCRUD';
import { GetCRUD } from './GetCRUD';
import { ResourceType } from './ResourceType';
import { StartCRUD } from './StartCRUD';
import { StopCRUD } from './StopCRUD';
import { BaseResource, BaseResourceOptions } from './types';

export interface CRUDOptions<Resource extends BaseResource, ResourceOptions extends BaseResourceOptions> {
  readonly resourceType: ResourceType<Resource, ResourceOptions>;
  readonly start?: StartCRUD<Resource, ResourceOptions> | undefined;
  readonly stop?: StopCRUD<Resource, ResourceOptions> | undefined;
  readonly delete?: DeleteCRUD<Resource, ResourceOptions>;
  readonly create?: CreateCRUD<Resource, ResourceOptions>;
  readonly get?: GetCRUD<Resource, ResourceOptions>;
  readonly describe?: DescribeCRUD<Resource, ResourceOptions>;
}

export class CRUD<Resource extends BaseResource, ResourceOptions extends BaseResourceOptions> {
  public readonly resourceType: ResourceType<Resource, ResourceOptions>;
  public readonly start: StartCRUD<Resource, ResourceOptions> | undefined;
  public readonly stop: StopCRUD<Resource, ResourceOptions> | undefined;
  public readonly delete: DeleteCRUD<Resource, ResourceOptions>;
  public readonly create: CreateCRUD<Resource, ResourceOptions>;
  public readonly get: GetCRUD<Resource, ResourceOptions>;
  public readonly describe: DescribeCRUD<Resource, ResourceOptions>;

  public constructor({
    resourceType,
    start = new StartCRUD({ resourceType }),
    stop = new StopCRUD({ resourceType }),
    delete: del = new DeleteCRUD({ resourceType }),
    create = new CreateCRUD({ resourceType }),
    get = new GetCRUD({ resourceType }),
    describe = new DescribeCRUD({ resourceType }),
  }: CRUDOptions<Resource, ResourceOptions>) {
    this.resourceType = resourceType;
    this.start = start;
    this.stop = stop;
    this.delete = del;
    this.create = create;
    this.get = get;
    this.describe = describe;
  }
}
