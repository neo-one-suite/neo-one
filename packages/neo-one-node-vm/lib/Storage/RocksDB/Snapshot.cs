using Neo.Persistence;
using RocksDbSharp;
using System;
using System.Collections.Generic;

namespace NEOONE.Storage.RocksDB
{
  internal class Snapshot : ISnapshot
  {
    private readonly Store store;
    private readonly RocksDb db;
    private readonly RocksDbSharp.Snapshot snapshot;
    private readonly ReadOptions options;

    public Snapshot(Store store, RocksDb db)
    {
      this.store = store;
      this.db = db;
      this.snapshot = db.CreateSnapshot();

      options = new ReadOptions();
      options.SetFillCache(false);
      options.SetSnapshot(snapshot);
    }

    public IEnumerable<(byte[] Key, byte[] Value)> Seek(byte[] keyOrPrefix, SeekDirection direction)
    {
      if (keyOrPrefix == null) keyOrPrefix = Array.Empty<byte>();

      using var it = db.NewIterator(store.defaultFamily, options);

      byte[] fullKey = keyOrPrefix;

      if (direction == SeekDirection.Forward)
        for (it.Seek(fullKey); it.Valid(); it.Next())
        {
          yield return (it.Key(), it.Value());
        }
      else
        for (it.SeekForPrev(fullKey); it.Valid(); it.Prev())
        {
          yield return (it.Key(), it.Value());
        }
    }

    public bool Contains(byte[] key)
    {
      byte[] fullKey = key == null ? new byte[] { } : key;
      return db.Get(fullKey ?? Array.Empty<byte>(), store.defaultFamily, options) != null;
    }

    public byte[] TryGet(byte[] key)
    {
      byte[] fullKey = key == null ? new byte[] { } : key;
      return db.Get(fullKey ?? Array.Empty<byte>(), store.defaultFamily, options);
    }

    public void Dispose()
    {
      snapshot.Dispose();
    }

    public void Delete(byte[] key)
    {
      throw new InvalidOperationException();
    }

    public void Put(byte[] key, byte[] value)
    {
      throw new InvalidOperationException();
    }

    public void Commit()
    {
      throw new InvalidOperationException();
    }
  }
}
