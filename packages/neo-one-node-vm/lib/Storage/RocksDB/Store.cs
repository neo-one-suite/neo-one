using Neo.Persistence;
using RocksDbSharp;
using System;
using System.Collections.Generic;
using System.IO;
using System.Runtime.CompilerServices;

namespace NEOONE.Storage.RocksDB
{
  internal class Store : IStore
  {
    private readonly RocksDb db;
    public readonly ColumnFamilyHandle defaultFamily;
    public Store(string path)
    {
      var families = new ColumnFamilies();
      db = RocksDb.OpenReadOnly(Options.Default, Path.GetFullPath(path), families, false);
      defaultFamily = db.GetDefaultColumnFamily();
    }


    public void Dispose()
    {
      db.Dispose();
    }

    /// <summary>
    /// Get family
    /// </summary>
    /// <param name="table">Table</param>
    /// <returns>Return column family</returns>
    [MethodImpl(MethodImplOptions.AggressiveInlining)]

    public ISnapshot GetSnapshot()
    {
      return new Snapshot(this, db);
    }

    public IEnumerable<(byte[] Key, byte[] Value)> Seek(byte[] keyOrPrefix, SeekDirection direction = SeekDirection.Forward)
    {
      if (keyOrPrefix == null) keyOrPrefix = Array.Empty<byte>();

      byte[] fullKey = keyOrPrefix;

      using var it = db.NewIterator(defaultFamily, Options.ReadDefault);
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
      return db.Get(fullKey ?? Array.Empty<byte>(), defaultFamily, Options.ReadDefault) != null;
    }

    public byte[] TryGet(byte[] key)
    {
      byte[] fullKey = key == null ? new byte[] { } : key;
      return db.Get(fullKey ?? Array.Empty<byte>(), defaultFamily, Options.ReadDefault);
    }

    public void Delete(byte[] key)
    {
      throw new InvalidOperationException();
    }

    public void Put(byte[] key, byte[] value)
    {
      throw new InvalidOperationException();
    }

    public void PutSync(byte[] key, byte[] value)
    {
      throw new InvalidOperationException();
    }
  }
}
