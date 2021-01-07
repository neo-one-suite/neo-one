using Neo.IO.Caching;
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

    public byte[] getFullKey(byte table, byte[] keyOrPrefix)
    {
      byte[] fullKey = new byte[keyOrPrefix.Length + 1];
      System.Buffer.SetByte(fullKey, 0, table);
      System.Buffer.BlockCopy(keyOrPrefix, 0, fullKey, 1, keyOrPrefix.Length);
      return fullKey;
    }

    public IEnumerable<(byte[] Key, byte[] Value)> Seek(byte table, byte[] keyOrPrefix, SeekDirection direction = SeekDirection.Forward)
    {
      if (keyOrPrefix == null) keyOrPrefix = Array.Empty<byte>();

      byte[] fullKey = getFullKey(table, keyOrPrefix);
      using var it = db.NewIterator(defaultFamily, Options.ReadDefault);
      if (direction == SeekDirection.Forward)
        for (it.Seek(fullKey); it.Valid() && it.Key()[0] == table; it.Next())
          yield return (it.Key()[1..], it.Value());
      else
        for (it.SeekForPrev(fullKey); it.Valid() && it.Key()[0] == table; it.Prev())
          yield return (it.Key()[1..], it.Value());
    }

    public bool Contains(byte table, byte[] key)
    {
      byte[] fullKey = key == null ? new byte[] { table } : getFullKey(table, key);
      return db.Get(fullKey ?? Array.Empty<byte>(), defaultFamily, Options.ReadDefault) != null;
    }

    public byte[] TryGet(byte table, byte[] key)
    {
      byte[] fullKey = key == null ? new byte[] { table } : getFullKey(table, key);
      return db.Get(fullKey ?? Array.Empty<byte>(), defaultFamily, Options.ReadDefault);
    }

    public void Delete(byte table, byte[] key)
    {
      throw new InvalidOperationException();
    }

    public void Put(byte table, byte[] key, byte[] value)
    {
      throw new InvalidOperationException();
    }

    public void PutSync(byte table, byte[] key, byte[] value)
    {
      throw new InvalidOperationException();
    }
  }
}
