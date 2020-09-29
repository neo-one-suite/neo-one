import { UInt256, VMState } from '@neo-one/client-common';
import { SnapshotName, SnapshotPartial } from '@neo-one/node-core';
import { ChangeReturn } from '../converters';
import { DefaultMethods, DispatchMethod } from '../types';

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

interface TransactionsDeleteArgs extends SnapshotChoice {
  readonly hash: UInt256;
}

interface CommitArgs extends Partial<SnapshotChoice> {
  readonly partial?: SnapshotPartial;
}

interface ChangeHashIndexArgs extends SnapshotChoice {
  readonly index: number;
  readonly hash: UInt256;
}

interface SetPersistingBlockArgs extends SnapshotChoice {
  readonly block: Buffer;
}

export interface SnapshotMethods extends DefaultMethods {
  readonly snapshot_blocks_add: DispatchMethod<boolean, BlocksAddArgs>;
  readonly snapshot_transactions_add: DispatchMethod<boolean, TransactionsAddArgs>;
  readonly snapshot_transactions_delete: DispatchMethod<boolean, TransactionsDeleteArgs>;
  readonly snapshot_commit: DispatchMethod<boolean, CommitArgs>;
  readonly snapshot_clone: DispatchMethod<boolean>;
  readonly snapshot_change_block_hash_index: DispatchMethod<boolean, ChangeHashIndexArgs>;
  readonly snapshot_change_header_hash_index: DispatchMethod<boolean, ChangeHashIndexArgs>;
  readonly snapshot_set_persisting_block: DispatchMethod<boolean, SetPersistingBlockArgs>;
  readonly snapshot_get_change_set: DispatchMethod<readonly ChangeReturn[], SnapshotChoice>;
}
