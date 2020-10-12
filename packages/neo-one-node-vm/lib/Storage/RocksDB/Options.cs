using RocksDbSharp;

namespace NEOONE.Storage.RocksDB
{
    public static class Options
    {
        public static readonly DbOptions Default = CreateDbOptions();
        public static readonly ReadOptions ReadDefault = new ReadOptions();
        public static readonly WriteOptions WriteDefault = new WriteOptions();
        public static readonly WriteOptions WriteDefaultSync = new WriteOptions().SetSync(true);

        public static DbOptions CreateDbOptions()
        {
            DbOptions options = new DbOptions();
            options.SetCreateMissingColumnFamilies(true);
            options.SetCreateIfMissing(true);
            options.SetErrorIfExists(false);
            options.SetMaxOpenFiles(1000);
            options.SetParanoidChecks(false);
            options.SetWriteBufferSize(4 << 20);
            options.SetBlockBasedTableFactory(new BlockBasedTableOptions().SetBlockSize(4096));
            return options;
        }
    }
}
