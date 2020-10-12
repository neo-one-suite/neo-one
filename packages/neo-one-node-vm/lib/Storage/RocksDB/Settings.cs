namespace NEOONE.Storage.RocksDB
{
    class Settings
    {
        public string Path { get; }

        public Settings(string path)
        {
            this.Path = path;
        }
    }
}
