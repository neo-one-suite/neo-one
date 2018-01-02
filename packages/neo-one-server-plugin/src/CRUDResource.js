/* @flow */
import type { Observable } from 'rxjs/Observable';

import type {
  BaseResource,
  BaseResourceOptions,
  Client,
  ModifyResourceResponse,
} from './types';
import CRUDResourceBase from './CRUDResourceBase';

export type Request$Options<ResourceOptions: Object> = {|
  name: string,
  cancel$: Observable<void>,
  options: ResourceOptions,
  client: Client,
|};

export default class CRUDResource<
  Resource: BaseResource,
  ResourceOptions: BaseResourceOptions,
> extends CRUDResourceBase<Resource, ResourceOptions> {
  request$(
    // eslint-disable-next-line
    options: Request$Options<ResourceOptions>,
  ): Observable<ModifyResourceResponse> {
    throw new Error('Not Implemented');
  }
}
