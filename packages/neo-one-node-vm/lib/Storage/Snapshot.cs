using System;
using Neo.Persistence;
using NEOONE.Storage.LevelDB;
using System.Collections.Generic;
using Neo.IO.Caching;
using LevelSnapshot = NEOONE.Storage.LevelDB.Snapshot;
using LevelHelper = NEOONE.Storage.LevelDB.Helper;

namespace NEOONE.Storage
{
    internal class Snapshot : ISnapshot
    {
        private readonly DB db;
        private readonly LevelSnapshot snapshot;
        private readonly ReadOptions options;
        private readonly WriteBatch changeSet;

        public Snapshot(DB db)
        {
            this.db = db;
            this.snapshot = db.GetSnapshot();
            this.options = new ReadOptions { FillCache = false, Snapshot = snapshot };
            this.changeSet = new WriteBatch();
        }

        public void Commit()
        {
            return;
        }

        public void Delete(byte table, byte[] key)
        {
            return;
        }

        public void Dispose()
        {
            snapshot.Dispose();
        }

        public IEnumerable<(byte[] Key, byte[] Value)> Seek(byte table, byte[] prefix, SeekDirection direction = SeekDirection.Forward)
        {
            return db.Seek(options, table, prefix, direction, (k, v) => (k[1..], v));
        }

        public void Put(byte table, byte[] key, byte[] value)
        {
            return;
        }

        public byte[] TryGet(byte table, byte[] key)
        {
            return db.Get(options, LevelHelper.CreateKey(table, key));
        }
    }
}
