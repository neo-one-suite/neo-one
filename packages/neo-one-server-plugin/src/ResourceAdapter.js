/* @flow */
import type { Observable } from 'rxjs/Observable';

import type { BaseResource, BaseResourceOptions, DescribeTable } from './types';
import type TaskList from './TaskList';

// Note that all call orders are user initiated unless otherwise specified.
export type ResourceAdapter<
  Resource: BaseResource,
  ResourceOptions: BaseResourceOptions,
> = {
  // Called after
  //    destroy (upon restart)
  //    destroy error (upon restart)
  // Only on fresh instance after server restart. Typically this should be used
  // to restore any internal state originally setup by create$ that is required
  // for start$.
  // ResouceType#initResourceAdapter: (adapterOptions: ResourceAdapterOptions) => Promise<ResourceAdapter<Resource, ResourceOptions>>;
  // Called after
  //    init (upon shutdown)
  //    create$ (upon shutdown)
  //    start$ (upon shutdown)
  //    start$ error (upon shutdown)
  //    stop$ (upon shutdown)
  //    stop$ error (upon shutdown)
  //    delete$ (immediately)
  //    delete$ error (upon shutdown)
  // Before server is going down. Typically this should just call stop$. Also
  // called if init fails - in this case a warning is shown to the user but
  // the resource is not deleted, it just can't be interacted with.
  +destroy: () => Promise<void>,
  // Called on initial creation.
  // ResourceType#createResourceAdapter$: (adapterOptions: ResourceAdapterOptions, options: ResourceOptions) => Observable<Progress | Ready>;
  // Called after
  //    create$
  //    create$ error (immediately)
  //    init
  //    start$
  //    start$ error
  //    stop$
  //    stop$ error
  // When the resource should be purged and completely cleaned up. Note that
  // cleaning up port allocations are handled automatically.
  +delete: (options: ResourceOptions) => TaskList,
  // Called after
  //    create$
  //    init
  //    stop$
  // When the resource should be started.
  +start: (options: ResourceOptions) => TaskList,
  // Called after
  //    start$
  //    start$ error (immediately)
  // When the resource should be stopped.
  +stop: (options: ResourceOptions) => TaskList,
  +resource$: Observable<Resource>,

  +getDebug: () => DescribeTable,
};
