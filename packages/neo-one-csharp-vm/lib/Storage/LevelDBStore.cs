using Neo.Persistence;
using NEOONE.Storage.LevelDB;

namespace NEOONE.Storage
{
    public class LevelDBStore
    {
        private string path;

        public LevelDBStore(string path)
        {
            this.path = path;
        }

        public void Repar()
        {
            DB.Repair(path, Options.Default);
        }

        public IStore GetStore()
        {
            return new Store(path);
        }
    }

}
