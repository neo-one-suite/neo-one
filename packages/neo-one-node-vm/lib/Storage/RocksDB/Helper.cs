using System.Text;
using System.IO;

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

    public enum Prefix : byte
    {
      // This is an arbitraty value and comes from @neo-one/node-storage-common/key.ts
      Storage = 0x70,
    }

    // We add the Storage Prefix to all lookups to keep them separate from our other
    // blockchain storage
    public static byte[] AddNEOONEPrefixByte(this byte[] key)
    {
      byte[] buffer = new byte[key.Length + 1];
      using (MemoryStream ms = new MemoryStream(buffer, true))
      using (BinaryWriter writer = new BinaryWriter(ms))
      {
        writer.Write((byte)Prefix.Storage);
        writer.Write(key);
      }
      return buffer;
    }
  }
}
