import { UInt256, VMState } from '@neo-one/client-common';
import { DefaultMethods, DispatchMethod, SnapshotName, SnapshotPartial } from '../types';

interface SnapshotChoice {
  readonly snapshot: SnapshotName;
}
interface BlocksAddArgs extends SnapshotChoice {
  readonly hash: UInt256;
  readonly block: Buffer;
}

interface TransactionsAddArgs extends SnapshotChoice {
  readonly tx: Buffer;
  readonly index: number;
  readonly state?: VMState;
}

interface CommitArgs extends Partial<SnapshotChoice> {
  readonly partial?: SnapshotPartial;
}

interface SetHeightArgs extends SnapshotChoice {
  readonly index: number;
}

export interface SnapshotMethods extends DefaultMethods {
  readonly snapshot_blocks_add: DispatchMethod<boolean, BlocksAddArgs>;
  readonly snapshot_transactions_add: DispatchMethod<boolean, TransactionsAddArgs>;
  readonly snapshot_commit: DispatchMethod<boolean, CommitArgs>;
  readonly snapshot_clone: DispatchMethod<boolean>;
  readonly snapshot_set_height: DispatchMethod<boolean, SetHeightArgs>;
}
