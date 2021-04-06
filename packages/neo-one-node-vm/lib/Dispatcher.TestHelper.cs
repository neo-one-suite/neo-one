using System;
using System.Collections.Generic;
using Neo.Persistence;
using Neo.SmartContract;

// It is worth noting this helper method shouldn't be used outside of testing purposes.
namespace NEOONE
{
  partial class Dispatcher
  {
    enum TestMethod
    {
      test_update_store,
      test_read_store,
      test_snapshot_add,
      test_snapshot_get
    }

    public class RawChange
    {
      public byte[] key { get; set; }
      public byte[] value { get; set; }
    }
    private dynamic dispatchTestMethod(TestMethod method, dynamic args)
    {
      switch (method)
      {
        case TestMethod.test_update_store:
          List<RawChange> changes = new List<RawChange> { };
          foreach (dynamic change in args.changes)
          {
            changes.Add(new RawChange() { key = (byte[])change.key, value = (byte[])change.value });
          }
          return this._updateStore(changes.ToArray());

        case TestMethod.test_read_store:
          byte[] key = (byte[])args.key;

          return this._readStore(key);

        case TestMethod.test_snapshot_add:
          StorageKey sKey = new StorageKey()
          {
            Id = (int)args.id,
            Key = (byte[])args.key,
          };

          StorageItem sItem = new StorageItem()
          {
            Value = (byte[])args.value,
          };


          return this._updateSnapshot(sKey, sItem);

        case TestMethod.test_snapshot_get:
          StorageKey getKey = new StorageKey()
          {
            Id = (int)args.id,
            Key = (byte[])args.key,
          };

          return this._readSnapshot(getKey);

        default:
          throw new InvalidOperationException();
      }
    }

    private dynamic _readStore(byte[] key)
    {
      return this.store.TryGet(key);
    }

    private bool _updateSnapshot(StorageKey key, StorageItem item)
    {
      this.snapshot.Add(key, item);

      return true;
    }

    private dynamic _readSnapshot(StorageKey key)
    {
      StorageItem item = this.snapshot.TryGet(key);
      if (item is null)
      {
        return null;
      }

      return item.Value;
    }

    private bool _updateStore(RawChange[] changes)
    {
      if (this.path != null)
      {
        throw new InvalidOperationException("Must use a memory store for this operation to be useful");
      }

      this.store?.Dispose();
      this.store = null;
      this.store = new MemoryStore();
      foreach (RawChange change in changes)
      {
        this.store.PutSync(change.key, change.value);
      }
      this.snapshot = new SnapshotCache(this.store);
      this.clonedSnapshot = this.snapshot.CreateSnapshot();

      return true;
    }
  }
}
