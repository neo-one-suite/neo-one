using System;
using System.Collections.Generic;
using System.Linq;
using Neo.IO;
using Neo.VM.Types;
using Neo;
using Neo.SmartContract;
using Neo.Network.P2P;
using Neo.Cryptography;

namespace NEOONE
{
  public class ReturnHelpers
  {
    public class PrimitiveReturn
    {
      public readonly object value;
      public readonly int Size;
      public readonly bool IsNull;
      public readonly StackItemType Type;

      public PrimitiveReturn(PrimitiveType item, dynamic value)
      {
        this.value = value;
        this.Size = item.Size;
        this.IsNull = item.IsNull;
        this.Type = item.Type;
      }
    }

    public class PointerReturn
    {
      public readonly byte[] value;
      public readonly int Position;
      public StackItemType Type => StackItemType.Pointer;
      public readonly bool IsNull;

      public PointerReturn(Neo.VM.Types.Pointer item)
      {
        this.value = (byte[])item.Script;
        this.Position = item.Position;
        this.IsNull = item.IsNull;
      }
    }

    public class ArrayReturn
    {
      public object[] value;
      public readonly int Count;
      public StackItemType Type => StackItemType.Array;
      public readonly bool IsNull;

      public ArrayReturn(Neo.VM.Types.Array item)
      {
        this.Count = item.Count;
        this.IsNull = item.IsNull;
        this.value = item.ToArray().Select((p) => convertStackItem(p)).ToArray();
      }
    }

    public class StructReturn
    {
      public object[] value;
      public readonly int Count;
      public StackItemType Type => StackItemType.Struct;
      public readonly bool IsNull;

      public StructReturn(Struct item)
      {
        this.Count = item.Count;
        this.IsNull = item.IsNull;
        this.value = item.ToArray().Select((p) => convertStackItem(p)).ToArray();
      }
    }

    public class KeyValueReturn
    {
      public PrimitiveReturn key;
      public object value;

      public KeyValueReturn(PrimitiveReturn key, dynamic value)
      {
        this.key = key;
        this.value = value;
      }
    }

    public class MapReturn
    {
      public KeyValueReturn[] value;
      public readonly int Count;
      public readonly bool IsNull;
      public StackItemType Type => StackItemType.Map;

      public MapReturn(Map item)
      {
        this.Count = item.Count;
        this.IsNull = item.IsNull;
        this.value = item.ToArray().Select((keyValue) =>
        {
          return new KeyValueReturn(
                  convertStackItem(keyValue.Key),
                  convertStackItem(keyValue.Value)
                );
        }).ToArray();
      }
    }

    public class BufferReturn
    {
      public byte[] value;
      public StackItemType Type => StackItemType.Buffer;
      public readonly bool IsNull;
      public BufferReturn(Neo.VM.Types.Buffer item)
      {
        this.value = item.InnerBuffer;
        this.IsNull = item.IsNull;
      }
    }

    public class InteropInterfaceReturn
    {
      public dynamic value;
      public StackItemType Type => StackItemType.InteropInterface;
      public readonly bool IsNull;

      public InteropInterfaceReturn(InteropInterface item)
      {
        this.value = item.GetInterface<dynamic>();
        this.IsNull = item.IsNull;
      }
    }

    public static PrimitiveReturn convertStackItem(PrimitiveType item)
    {
      return item.Type switch
      {
        StackItemType.Boolean => new PrimitiveReturn(item, item.GetBoolean()),
        StackItemType.Integer => new PrimitiveReturn(item, item.GetInteger().ToByteArray()),
        StackItemType.ByteString => new PrimitiveReturn(item, item.GetSpan().ToArray()),
        _ => throw new ArgumentException($"{item.Type} is not a valid StackItem argument")
      };
    }

    public static dynamic convertStackItem(StackItem item)
    {
      return item.Type switch
      {
        StackItemType.Any => item,
        StackItemType.Buffer => new BufferReturn((Neo.VM.Types.Buffer)item),
        StackItemType.Pointer => new PointerReturn((Neo.VM.Types.Pointer)item),
        StackItemType.Array => new ArrayReturn((Neo.VM.Types.Array)item),
        StackItemType.Struct => new StructReturn((Struct)item),
        StackItemType.Map => new MapReturn((Map)item),
        StackItemType.InteropInterface => new InteropInterfaceReturn((InteropInterface)item),
        _ => convertStackItem((PrimitiveType)item)
      };
    }

    public class LogReturn
    {
      public byte[] containerHash;
      public byte[] callingScriptHash;
      public string message;
      public int position;

      public LogReturn(LogEventArgs log)
      {
        containerHash = log.ScriptContainer != null ? Crypto.Hash256(log.ScriptContainer.GetSignData(ProtocolSettings.Default.Network)) : null;
        callingScriptHash = log.ScriptHash != null ? log.ScriptHash.ToArray() : null;
        message = log.Message;
        position = -1; // log.Position
      }
    }

    public static dynamic convertLog(LogEventArgs log)
    {
      return new LogReturn(log);
    }
    public class ProtocolSettingsReturn
    {
      public int network;
      public int addressVersion;
      public string[] standbyCommittee;
      public int committeeMembersCount;
      public int validatorsCount;
      public string[] seedList;
      public int millisecondsPerBlock;
      public int memoryPoolMaxTransactions;
      public int maxTraceableBlocks;
      public int maxTransactionsPerBlock;
      public dynamic nativeUpdateHistory;
      public string initialGasDistribution;

      public ProtocolSettingsReturn(ProtocolSettings value)
      {
        this.network = Convert.ToInt32(value.Network);
        this.addressVersion = Convert.ToInt32(value.AddressVersion);
        this.standbyCommittee = value.StandbyCommittee.Select(p => p.ToString()).ToArray();
        this.committeeMembersCount = value.CommitteeMembersCount;
        this.validatorsCount = value.ValidatorsCount;
        this.seedList = value.SeedList;
        this.millisecondsPerBlock = Convert.ToInt32(value.MillisecondsPerBlock);
        this.memoryPoolMaxTransactions = value.MemoryPoolMaxTransactions;
        this.maxTraceableBlocks = Convert.ToInt32(value.MaxTraceableBlocks);
        this.initialGasDistribution = value.InitialGasDistribution.ToString();
        this.maxTransactionsPerBlock = Convert.ToInt32(value.MaxTransactionsPerBlock);

        Dictionary<string, int[]> UpdateHistory = new Dictionary<string, int[]>();
        foreach (KeyValuePair<string, uint[]> kvp in value.NativeUpdateHistory)
        {
          UpdateHistory[kvp.Key] = kvp.Value.Select(v => Convert.ToInt32(v)).ToArray();
        }

        this.nativeUpdateHistory = UpdateHistory;
      }
    }
  }
}
