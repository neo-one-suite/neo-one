using System.Data.Common;

namespace NEOONE.Storage.LevelDB
{
    public class LevelDBException : DbException
    {
        internal LevelDBException(string message)
            : base(message)
        {
        }
    }
}
