/* @flow */
import type { Observable } from 'rxjs/Observable';

import type { BaseResource, Client, ModifyResourceResponse } from './types';
import CRUDResourceBase from './CRUDResourceBase';

// flowlint-next-line unclear-type:off
export type Request$Options<ResourceOptions: Object> = {|
  name: string,
  cancel$: Observable<void>,
  options: ResourceOptions,
  client: Client,
|};

export default class CRUDResource<
  Resource: BaseResource,
  // flowlint-next-line unclear-type:off
  ResourceOptions: Object,
> extends CRUDResourceBase<Resource, ResourceOptions> {
  request$(
    // eslint-disable-next-line
    options: Request$Options<ResourceOptions>,
  ): Observable<ModifyResourceResponse> {
    throw new Error('Not Implemented');
  }
}
