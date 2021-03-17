import { SnapshotName } from '@neo-one/node-core';
import { ChangeReturn } from '../converters';
import { DefaultMethods, DispatchMethod } from '../types';

interface SnapshotChoice {
  readonly snapshot: SnapshotName;
}

interface CommitArgs extends Partial<SnapshotChoice> {}

export interface SnapshotMethods extends DefaultMethods {
  readonly snapshot_commit: DispatchMethod<boolean, CommitArgs>;
  readonly snapshot_clone: DispatchMethod<boolean>;
  readonly snapshot_get_change_set: DispatchMethod<readonly ChangeReturn[], SnapshotChoice>;
}
