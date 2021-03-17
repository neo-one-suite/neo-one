import { SnapshotName } from '@neo-one/node-core';
import { parseChangeReturns } from './converters';
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

  public commit() {
    return this.dispatch({
      method: 'snapshot_commit',
      args: {
        snapshot: this.snapshot,
      },
    });
  }

  public getChangeSet() {
    return parseChangeReturns(
      this.dispatch({
        method: 'snapshot_get_change_set',
        args: {
          snapshot: this.snapshot,
        },
      }),
    );
  }

  public clone() {
    this.cloneInternal();
  }
}
