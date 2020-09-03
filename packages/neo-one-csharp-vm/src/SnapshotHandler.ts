import { UInt256, VMState } from '@neo-one/client-common';
import { Block, SnapshotName, SnapshotPartial, Transaction } from '@neo-one/csharp-core';
import { SnapshotMethods } from './Methods';
import { DispatcherFunc } from './types';

interface SnapshotDispatcher {
  readonly dispatch: DispatcherFunc<SnapshotMethods>;
}

export class SnapshotHandler {
  private readonly dispatch: DispatcherFunc<SnapshotMethods>;
  private readonly snapshot: SnapshotName;
  private readonly cloneInternal: () => void;

  public constructor(dispatcher: SnapshotDispatcher, snapshot: SnapshotName) {
    this.dispatch = dispatcher.dispatch.bind(this);
    this.snapshot = snapshot;
    this.cloneInternal =
      this.snapshot === 'main'
        ? () => this.dispatch({ method: 'snapshot_clone' })
        : () => {
            /* do nothing */
          };
  }

  public addBlock(block: Block) {
    const hash = block.hash;
    const buffer = block.serializeWire();

    return this.dispatch({
      method: 'snapshot_blocks_add',
      args: {
        hash,
        block: buffer,
        snapshot: this.snapshot,
      },
    });
  }

  public addTransaction(transaction: Transaction, index: number, state = VMState.BREAK) {
    const tx = transaction.serializeWire();

    return this.dispatch({
      method: 'snapshot_transactions_add',
      args: {
        tx,
        index,
        state,
        snapshot: this.snapshot,
      },
    });
  }

  public changeBlockHashIndex(index: number, hash: UInt256) {
    return this.dispatch({
      method: 'snapshot_change_block_hash_index',
      args: {
        index,
        hash,
        snapshot: this.snapshot,
      },
    });
  }

  public changeHeaderHashIndex(index: number, hash: UInt256) {
    return this.dispatch({
      method: 'snapshot_change_header_hash_index',
      args: {
        index,
        hash,
        snapshot: this.snapshot,
      },
    });
  }

  public setPersistingBlock(block: Block) {
    const buffer = block.serializeWire();

    return this.dispatch({
      method: 'snapshot_set_persisting_block',
      args: {
        snapshot: this.snapshot,
        block: buffer,
      },
    });
  }

  public commit(partial?: SnapshotPartial) {
    return this.dispatch({
      method: 'snapshot_commit',
      args: {
        partial,
        snapshot: this.snapshot,
      },
    });
  }

  public getChangeSet() {
    return this.dispatch({
      method: 'snapshot_get_change_set',
      args: {
        snapshot: this.snapshot,
      },
    });
  }

  public clone() {
    this.cloneInternal();
  }
}
