using System;
using System.IO;
using System.Linq;
using Neo;
using Neo.IO;
using Neo.Network.P2P.Payloads;
using Neo.Persistence;
using Neo.SmartContract;
using Neo.SmartContract.Native;
using Neo.SmartContract.Manifest;
using Neo.VM;
using Neo.VM.Types;

namespace NEOONE
{
  partial class Dispatcher
  {

    private enum ContainerType
    {
      Block,
      Header,
      Transaction,
      Signers,
      ExtensiblePayload,
    }

    private IVerifiable deserializeContainer(dynamic args)
    {
      byte[] serializedContainer = (byte[])args.buffer;
      string typeIn = (string)args.type;
      IVerifiable container;

      ContainerType type;
      if (Enum.TryParse<ContainerType>(typeIn, out type))
      {

        switch (type)
        {
          case ContainerType.Block:
            container = new Block();
            break;
          case ContainerType.Header:
            container = new Header();
            break;
          case ContainerType.Transaction:
            container = new Transaction();
            break;
          case ContainerType.Signers:
            container = new Signers();
            break;
          case ContainerType.ExtensiblePayload:
            container = new ExtensiblePayload();
            break;
          default:
            throw new ArgumentException($"{typeIn} is not a valid container type");
        }
        using (MemoryStream ms = new MemoryStream(serializedContainer))
        using (BinaryReader reader = new BinaryReader(ms))
        {
          container.Deserialize(reader);
        }

        return container;
      }

      throw new ArgumentException($"{typeIn} is not a valid container type");
    }

    private enum EngineMethod
    {
      create,
      execute,
      loadscript,
      loadcontract,
      setinstructionpointer,
      getvmstate,
      getresultstack,
      gettrigger,
      getgasconsumed,
      getnotifications,
      getlogs,
      getfaultexception,
      dispose_engine,
      push,
    }

    private dynamic dispatchEngineMethod(EngineMethod method, dynamic args)
    {
      switch (method)
      {
        case EngineMethod.create:
          TriggerType trigger = (TriggerType)args.trigger;
          long gas = long.Parse((string)args.gas);
          IVerifiable container = null;
          if (args.container != null)
          {
            container = deserializeContainer(args.container);
          }
          Block persistingBlock = null;
          if (args.persistingBlock != null)
          {
            persistingBlock = new Block();
            using (MemoryStream ms = new MemoryStream(args.persistingBlock))
            using (BinaryReader reader = new BinaryReader(ms))
            {
              persistingBlock.Deserialize(reader);
            }
          }
          ProtocolSettings settings = ProtocolSettings.Default;
          if (args.settings != null)
          {
            settings = ProtocolSettings.Load(parseConfig(args.settings));
          }

          return this._create(trigger, container, this.selectSnapshot(args.snapshot, false), persistingBlock, settings, gas);

        case EngineMethod.execute:
          return this._execute();

        case EngineMethod.loadscript:
          Script script = new Script((byte[])args.script);
          CallFlags flags = (CallFlags)((byte)args.flags);
          UInt160 scriptHash = null;
          int initialPosition = 0;
          int rvcount = -1;

          if (args.scriptHash != null)
          {
            scriptHash = UInt160.Parse((string)args.scriptHash);
          }

          if (args.initialPosition != null)
          {
            initialPosition = (int)args.initialPosition;
          }

          if (args.rvcount != null)
          {
            rvcount = (int)args.rvcount;
          }

          return this._loadScript(script, flags, scriptHash, rvcount, initialPosition);

        case EngineMethod.loadcontract:
          UInt160 contractHash = new UInt160((byte[])args.hash);
          string contractMethod = (string)args.method;
          CallFlags contractFlags = (CallFlags)((byte)args.flags);
          int pcount = (int)args.pcount;

          return this._loadContract(contractHash, contractMethod, pcount, contractFlags);

        case EngineMethod.getvmstate:
          return this._getVMState();

        case EngineMethod.getresultstack:
          return this._getResultStack();

        case EngineMethod.gettrigger:
          return this._getTrigger();

        case EngineMethod.getgasconsumed:
          return this._getGasConsumed();

        case EngineMethod.getnotifications:
          return this._getNotifications();

        case EngineMethod.getlogs:
          return this._getLogs();

        case EngineMethod.getfaultexception:
          return this._getFaultException();

        case EngineMethod.dispose_engine:
          this.disposeEngine();

          return true;

        case EngineMethod.push:
          return this._push((string)args.item);

        default:
          throw new InvalidOperationException();
      }
    }

    private void disposeEngine()
    {
      if (this.engine != null)
      {
        this.engine.Dispose();
        this.engine = null;
      }
    }

    private bool _create(TriggerType trigger, IVerifiable container, DataCache snapshot, Block persistingBlock, ProtocolSettings settings, long gas)
    {
      this.disposeEngine();
      this.engine = ApplicationEngine.Create(trigger, container, snapshot, persistingBlock, settings, gas);

      return true;
    }

    private VMState _execute()
    {
      this.isEngineInitialized();
      return this.engine.Execute();
    }

    private bool _loadScript(Script script, CallFlags flags, UInt160 hash = null, int rvcount = -1, int initialPosition = 0)
    {
      this.isEngineInitialized();
      if (hash == null)
      {
        this.engine.LoadScript(script, rvcount, initialPosition, p =>
        {
          p.CallFlags = flags;
        });

        return true;
      }

      this.engine.LoadScript(script, rvcount, initialPosition, p =>
      {
        p.CallFlags = flags;
        p.ScriptHash = hash;
      });


      return true;
    }

    private bool _loadContract(UInt160 hash, string method, int pcount, CallFlags flags)
    {
      this.isEngineInitialized();
      ContractState cs = NativeContract.ContractManagement.GetContract(this.snapshot, hash);
      if (cs is null) return false;
      ContractMethodDescriptor md = cs.Manifest.Abi.GetMethod(method, pcount);

      this.engine.LoadContract(cs, md, flags);

      return true;
    }

    private VMState _getVMState()
    {
      return this.engine != null ? this.engine.State : VMState.BREAK;
    }

    private dynamic[] _getResultStack()
    {
      return this.engine != null ? this.engine.ResultStack.Select((StackItem p) => ReturnHelpers.convertStackItem(p)).ToArray() : new dynamic[0];
    }

    private TriggerType _getTrigger()
    {
      this.isEngineInitialized();
      return this.engine.Trigger;
    }

    private dynamic _getContainer()
    {
      this.isEngineInitialized();
      return this.engine.ScriptContainer;
    }

    private string _getGasConsumed()
    {
      return this.engine != null ? this.engine.GasConsumed.ToString() : "0";
    }

    private dynamic[] _getNotifications()
    {
      this.isEngineInitialized();
      var events = this.engine.Notifications;
      if (events == null || events.Count == 0)
      {
        return new dynamic[] { };
      }

      return events.Select((p) => ReturnHelpers.convertStackItem(p.ToStackItem(new ReferenceCounter()))).ToArray();
    }

    private dynamic[] _getLogs()
    {
      this.isEngineInitialized();
      var logs = this.engine.Logs;
      if (logs == null || logs.Count == 0)
      {
        return new dynamic[] { };
      }

      return logs.Select((p) => ReturnHelpers.convertLog(p)).ToArray();
    }

    private string _getFaultException()
    {
      return this.engine.FaultException?.GetBaseException().Message.ToString();
    }

    private bool _push(string item)
    {
      this.engine.Push(item);

      return true;
    }

    private bool isEngineInitialized()
    {
      if (this.engine == null)
      {
        throw new InvalidOperationException("Can't invoke an engine method without creating the engine");
      }

      return true;
    }
  }

  internal class Signers : IVerifiable
  {
    private Signer[] _signers;
    public Witness[] Witnesses { get; set; }
    public int Size { get; }

    public Signers(Signer[] signers)
    {
      _signers = signers;
    }

    public Signers()
    {

    }

    public void Serialize(BinaryWriter writer)
    {
      throw new NotImplementedException();
    }

    public void Deserialize(BinaryReader reader)
    {
      _signers = reader.ReadSerializableArray<Signer>();
    }

    public void DeserializeUnsigned(BinaryReader reader)
    {
      throw new NotImplementedException();
    }

    public Neo.UInt160[] GetScriptHashesForVerifying(DataCache snapshot)
    {
      return _signers.Select(p => p.Account).ToArray();
    }

    public Signer[] GetSigners()
    {
      return _signers;
    }

    public void SerializeUnsigned(BinaryWriter writer)
    {
      throw new NotImplementedException();
    }
  }
}
