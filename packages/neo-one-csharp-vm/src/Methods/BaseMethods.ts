import { DefaultMethods, DispatchMethod } from '../types';

interface InitArgs {
  readonly path?: string;
}

export interface BaseMethods extends DefaultMethods {
  readonly init: DispatchMethod<boolean, InitArgs>;
  readonly dispose_engine: DispatchMethod<boolean>;
  readonly snapshot_reset: DispatchMethod<boolean>;
  readonly dispose: DispatchMethod<boolean>;
}
