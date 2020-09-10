using System;
using System.Linq;
using Neo.IO;
using Neo.SmartContract;
using Neo.VM.Types;

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
                StackItemType.Buffer => item,
                StackItemType.Pointer => new PointerReturn((Neo.VM.Types.Pointer)item),
                StackItemType.Array => new ArrayReturn((Neo.VM.Types.Array)item),
                StackItemType.Struct => new StructReturn((Struct)item),
                StackItemType.Map => new MapReturn((Map)item),
                StackItemType.InteropInterface => new InteropInterfaceReturn((InteropInterface)item),
                _ => convertStackItem((PrimitiveType)item)
            };
        }

        public class NotifyEventReturn
        {
            public byte[] scriptContainer;
            public byte[] scriptHash;
            public string eventName;
            public dynamic[] state;

            public NotifyEventReturn(NotifyEventArgs notifyEvent)
            {
                this.scriptContainer = ((ISerializable)notifyEvent.ScriptContainer).ToArray();
                this.scriptHash = notifyEvent.ScriptHash.ToArray();
                this.eventName = notifyEvent.EventName;
                this.state = convertStackItem(notifyEvent.State);
            }
        }
    }
}
