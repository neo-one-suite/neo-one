import { Observable } from 'rxjs';
import { CRUDResourceBase } from './CRUDResourceBase';
import { BaseResource, BaseResourceOptions, Client, ExecuteTaskListResponse } from './types';

export interface Request$Options<ResourceOptions extends object> {
  readonly name: string;
  readonly cancel$: Observable<void>;
  readonly options: ResourceOptions;
  readonly client: Client;
}

export class CRUDResource<
  Resource extends BaseResource = BaseResource,
  ResourceOptions extends BaseResourceOptions = BaseResourceOptions
> extends CRUDResourceBase<Resource, ResourceOptions> {
  public request$(_options: Request$Options<ResourceOptions>): Observable<ExecuteTaskListResponse> {
    throw new Error('Not Implemented');
  }
}
