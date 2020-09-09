using System;

namespace NEOONE.Storage.LevelDB
{
    public class WriteBatch
    {
        internal readonly IntPtr handle = Native.leveldb_writebatch_create();

        ~WriteBatch()
        {
            Native.leveldb_writebatch_destroy(handle);
        }

        public void Clear()
        {
            Native.leveldb_writebatch_clear(handle);
        }

        public void Delete(byte[] key)
        {
            Native.leveldb_writebatch_delete(handle, key, (UIntPtr)key.Length);
        }

        public void Put(byte[] key, byte[] value)
        {
            Native.leveldb_writebatch_put(handle, key, (UIntPtr)key.Length, value, (UIntPtr)value.Length);
        }
    }
}
