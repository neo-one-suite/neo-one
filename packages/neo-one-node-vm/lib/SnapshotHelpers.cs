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
    public ChangeSet(DataCache snapshot)
    {
      foreach (DataCache.Trackable value in snapshot.GetChangeSet())
      {
        set.Add(new Change(value));
      }
    }
  }

  public class Change
  {
    public string type;
    public string itemType;
    public byte[] key;
    public byte[] value;
    public Change(DataCache.Trackable change)
    {
      this.type = change.State.ToString();
      this.key = ((ISerializable)change.Key).ToArray();
      this.value = ((ISerializable)change.Item).ToArray();
    }
  }

}


