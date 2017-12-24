/* @flow */
import type { Observable } from 'rxjs/Observable';

import type { BaseResource, Client, ModifyResourceResponse } from './types';
import CRUDResourceBase from './CRUDResourceBase';

export default class CRUDResource<
  Resource: BaseResource,
  // flowlint-next-line unclear-type:off
  ResourceOptions: Object,
> extends CRUDResourceBase<Resource, ResourceOptions> {
  // eslint-disable-next-line
  request$(options: {|
    name: string,
    cancel$: Observable<void>,
    options: ResourceOptions,
    client: Client,
  |}): Observable<ModifyResourceResponse> {
    throw new Error('Not Implemented');
  }
}
