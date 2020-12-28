import { DefaultMethods, DispatchMethod } from '../types';

interface RawChange {
  readonly table: number;
  readonly key: Buffer;
  readonly value: Buffer;
}

interface UpdateStoreArgs {
  readonly changes: readonly RawChange[];
}

export interface TestMethods extends DefaultMethods {
  readonly test_update_store: DispatchMethod<boolean, UpdateStoreArgs>;
}
