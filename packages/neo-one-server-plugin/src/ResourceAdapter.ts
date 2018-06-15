import { Observable } from 'rxjs';
import { TaskList } from './TaskList';
import { BaseResource, BaseResourceOptions, DescribeTable } from './types';

// Note that all call orders are user initiated unless otherwise specified.
export interface ResourceAdapter<Resource extends BaseResource, ResourceOptions extends BaseResourceOptions> {
  readonly destroy: () => Promise<void>;

  readonly delete: (options: ResourceOptions) => TaskList;

  readonly start: (options: ResourceOptions) => TaskList;

  readonly stop: (options: ResourceOptions) => TaskList;
  readonly resource$: Observable<Resource>;

  readonly getDebug: () => DescribeTable;
}
