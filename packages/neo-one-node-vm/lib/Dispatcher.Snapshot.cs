using System;
using System.IO;
using Neo.Network.P2P.Payloads;
using Neo.Persistence;
using NEOONE.Storage;

namespace NEOONE
{
  partial class Dispatcher
  {

    private DataCache snapshot;
    private DataCache clonedSnapshot;

    enum SnapshotMethod
    {
      snapshot_clone,
      snapshot_commit,
      snapshot_reset,
      snapshot_get_change_set,
    }

    private dynamic dispatchSnapshotMethod(SnapshotMethod method, dynamic args)
    {
      switch (method)
      {
        case SnapshotMethod.snapshot_clone:
          return this._snapshotClone();

        case SnapshotMethod.snapshot_get_change_set:
          return this._snapshotGetChangeSet(this.selectSnapshot(args.snapshot, true));


        case SnapshotMethod.snapshot_commit:
          this._snapshotCommit(this.selectSnapshot(args.snapshot));

          return true;

        case SnapshotMethod.snapshot_reset:
          this.resetSnapshots();

          return true;

        default:
          throw new InvalidOperationException();
      }
    }


    private void resetSnapshots()
    {
      this.store?.Dispose();
      this.store = null;
      this.store = this.path != null ? new RocksDBStore(this.path).GetStore() : new MemoryStore();
      this.snapshot = new SnapshotCache(this.store);
      this.clonedSnapshot = this.snapshot.CreateSnapshot();
    }

    private DataCache selectSnapshot(string snapshot, bool required = true)
    {
      switch (snapshot)
      {
        case "main":
          return this.snapshot;
        case "clone":
          return this.clonedSnapshot;
        default:
          if (required) throw new InvalidOperationException("Must specify snapshot for this method");
          return null;
      }
    }

    private void _snapshotCommit(DataCache snapshot)
    {
      snapshot.Commit();
    }

    private dynamic _snapshotGetChangeSet(DataCache snapshot)
    {
      return new ChangeSet(snapshot).set.ToArray();
    }

    private bool _snapshotClone()
    {
      this.clonedSnapshot = this.snapshot.CreateSnapshot();

      return true;
    }
  }

}
