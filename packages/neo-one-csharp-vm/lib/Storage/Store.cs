using Neo.IO.Caching;
using NEOONE.Storage.LevelDB;
using Neo.Persistence;
using System;
using System.Collections.Generic;
using LevelHelper = NEOONE.Storage.LevelDB.Helper;

namespace NEOONE.Storage
{
    internal class Store : IStore
    {
        private const byte SYS_Version = 0xf0;
        private readonly DB db;

        public Store(string path)
        {
            this.db = DB.Open(path, new Options { CreateIfMissing = true, FilterPolicy = Native.leveldb_filterpolicy_create_bloom(15) });
        }

        public void Delete(byte table, byte[] key)
        {
            throw new InvalidOperationException("C# LevelDB Storage is readonly");
        }

        public void Dispose()
        {
            db.Dispose();
        }

        public IEnumerable<(byte[], byte[])> Seek(byte table, byte[] prefix, SeekDirection direction = SeekDirection.Forward)
        {
            return db.Seek(ReadOptions.Default, table, prefix, direction, (k, v) => (k[1..], v));
        }

        public ISnapshot GetSnapshot()
        {
            return new Snapshot(db);
        }

        public void Put(byte table, byte[] key, byte[] value)
        {
            throw new InvalidOperationException("C# LevelDB Storage is readonly");
        }

        public void PutSync(byte table, byte[] key, byte[] value)
        {
            throw new InvalidOperationException("C# LevelDB Storage is readonly");
        }

        public byte[] TryGet(byte table, byte[] key)
        {
            return db.Get(ReadOptions.Default, LevelHelper.CreateKey(table, key));
        }
    }
}
