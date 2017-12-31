/* @flow */
import GetCRUD from './GetCRUD';
import StartCRUD from './StartCRUD';
import StopCRUD from './StopCRUD';
import DeleteCRUD from './DeleteCRUD';
import CreateCRUD from './CreateCRUD';
import DescribeCRUD from './DescribeCRUD';

import type { BaseResource, BaseResourceOptions } from './types';
import type ResourceType from './ResourceType';

export type CRUDOptions<
  Resource: BaseResource,
  ResourceOptions: BaseResourceOptions,
> = {|
  resourceType: ResourceType<Resource, ResourceOptions>,
  start?: ?StartCRUD<Resource, ResourceOptions>,
  stop?: ?StopCRUD<Resource, ResourceOptions>,
  delete?: DeleteCRUD<Resource, ResourceOptions>,
  create?: CreateCRUD<Resource, ResourceOptions>,
  get?: GetCRUD<Resource, ResourceOptions>,
  describe?: DescribeCRUD<Resource, ResourceOptions>,
|};

export default class CRUD<
  Resource: BaseResource,
  ResourceOptions: BaseResourceOptions,
> {
  resourceType: ResourceType<Resource, ResourceOptions>;
  start: ?StartCRUD<Resource, ResourceOptions>;
  stop: ?StopCRUD<Resource, ResourceOptions>;
  delete: DeleteCRUD<Resource, ResourceOptions>;
  create: CreateCRUD<Resource, ResourceOptions>;
  get: GetCRUD<Resource, ResourceOptions>;
  describe: DescribeCRUD<Resource, ResourceOptions>;

  constructor({
    resourceType,
    start,
    stop,
    delete: del,
    create,
    get,
    describe,
  }: CRUDOptions<Resource, ResourceOptions>) {
    this.resourceType = resourceType;
    this.start =
      start === null ? null : start || new StartCRUD({ resourceType });
    this.stop = stop === null ? null : stop || new StopCRUD({ resourceType });
    this.delete = del || new DeleteCRUD({ resourceType });
    this.create = create || new CreateCRUD({ resourceType });
    this.get = get || new GetCRUD({ resourceType });
    this.describe = describe || new DescribeCRUD({ resourceType });
  }
}
