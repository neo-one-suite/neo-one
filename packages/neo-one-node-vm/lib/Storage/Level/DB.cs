using System;
using System.IO;

namespace NEOONE.Storage.LevelDB
{
    public class DB : IDisposable
    {
        private IntPtr handle;

        /// <summary>
        /// Return true if haven't got valid handle
        /// </summary>
        public bool IsDisposed => handle == IntPtr.Zero;

        private DB(IntPtr handle)
        {
            this.handle = handle;
        }

        public void Dispose()
        {
            if (handle != IntPtr.Zero)
            {
                Native.leveldb_close(handle);
                handle = IntPtr.Zero;
            }
        }

        public void Delete(object options, byte[] key)
        {
            throw new InvalidOperationException();
        }

        public byte[] Get(ReadOptions options, byte[] key)
        {
            IntPtr value = Native.leveldb_get(handle, options.handle, key, (UIntPtr)key.Length, out UIntPtr length, out IntPtr error);
            try
            {
                if (error != IntPtr.Zero)
                {
                    Native.leveldb_free(error);
                    return null;
                }
                return value.ToByteArray(length);
            }
            finally
            {
                if (value != IntPtr.Zero) Native.leveldb_free(value);
            }
        }

        public Snapshot GetSnapshot()
        {
            return new Snapshot(handle);
        }

        public Iterator NewIterator(ReadOptions options)
        {
            return new Iterator(Native.leveldb_create_iterator(handle, options.handle));
        }

        public static DB Open(string name)
        {
            return Open(name, Options.Default);
        }

        public static DB Open(string name, Options options)
        {
            IntPtr handle = Native.leveldb_open(options.handle, Path.GetFullPath(name), out IntPtr error);
            NativeHelper.CheckError(error);
            return new DB(handle);
        }

        public void Put(object options, byte[] key, byte[] value)
        {
            throw new InvalidOperationException("C# LevelDB Storage is readonly");
        }

        public static void Repair(string name, Options options)
        {
            Native.leveldb_repair_db(options.handle, Path.GetFullPath(name), out IntPtr error);
            NativeHelper.CheckError(error);
        }

        public void Write(object options, WriteBatch write_batch)
        {
            throw new InvalidOperationException("C# LevelDB Storage is readonly");
        }
    }
}
