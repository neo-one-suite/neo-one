using Neo.Persistence;
using System.Collections.Generic;
using Neo.IO;

namespace NEOONE
{
  interface CommitStore
  {
    void Commit();
  }

  public class ChangeSet
  {
    public List<Change> set = new List<Change>();
    public ChangeSet(StoreView snapshot)
    {
      foreach (var value in snapshot.Blocks.GetChangeSet())
      {
        set.Add(new Change("block", value));
      }

      foreach (var value in snapshot.Transactions.GetChangeSet())
      {
        set.Add(new Change("transaction", value));
      }
      foreach (var value in snapshot.Storages.GetChangeSet())
      {
        set.Add(new Change("storage", value));
      }
      foreach (var value in snapshot.HeaderHashList.GetChangeSet())
      {
        set.Add(new Change("headerHashList", value));
      }
    }
  }

  public class Change
  {
    public string type;
    public string itemType;
    public byte[] key;
    public byte[] value;
    public Change(string itemType, dynamic change)
    {
      this.type = change.State.ToString();
      this.key = ((ISerializable)change.Key).ToArray();
      this.value = ((ISerializable)change.Item).ToArray();
      this.itemType = itemType;
    }
  }

}


