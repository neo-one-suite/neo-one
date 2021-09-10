using System.Text;

namespace NEOONE.Storage.RocksDB
{
  public static class Helper
  {
    public static string ToHexString(this byte[] value)
    {
      StringBuilder sb = new StringBuilder();
      foreach (byte b in value)
        sb.AppendFormat("{0:x2}", b);
      return sb.ToString();
    }
  }
}
