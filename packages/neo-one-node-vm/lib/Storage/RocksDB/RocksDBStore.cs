using Neo.Persistence;
using NEOONE.Storage.RocksDB;

namespace NEOONE.Storage
{
    public class RocksDBStore
    {
        private string path;

        public RocksDBStore(string path)
        {
            this.path = path;
        }

        public IStore GetStore()
        {
            return new Store(path);
        }
    }

}
