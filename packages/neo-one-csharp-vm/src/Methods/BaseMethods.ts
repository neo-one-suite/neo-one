import { DefaultMethods, DispatchMethod } from '../types';

export interface BaseMethods extends DefaultMethods {
  readonly init: DispatchMethod<boolean>;
  readonly dispose_engine: DispatchMethod<boolean>;
  readonly snapshot_reset: DispatchMethod<boolean>;
  readonly dispose: DispatchMethod<boolean>;
}
