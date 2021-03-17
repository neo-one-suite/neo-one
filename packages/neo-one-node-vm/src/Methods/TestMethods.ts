import { DefaultMethods, DispatchMethod } from '../types';

interface RawChange {
  readonly key: Buffer;
  readonly value: Buffer;
}

interface UpdateStoreArgs {
  readonly changes: readonly RawChange[];
}

interface ReadStoreArgs {
  readonly key: Buffer;
}

interface SnapshotAddArgs {
  readonly key: Buffer;
  readonly id: number;
  readonly value: Buffer;
}

interface SnapshotGetArgs {
  readonly key: Buffer;
  readonly id: number;
}

export interface TestMethods extends DefaultMethods {
  readonly test_update_store: DispatchMethod<boolean, UpdateStoreArgs>;
  readonly test_read_store: DispatchMethod<Buffer, ReadStoreArgs>;
  readonly test_snapshot_add: DispatchMethod<boolean, SnapshotAddArgs>;
  readonly test_snapshot_get: DispatchMethod<Buffer | undefined, SnapshotGetArgs>;
}
