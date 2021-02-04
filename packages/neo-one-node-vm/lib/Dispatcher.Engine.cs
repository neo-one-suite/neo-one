using System;
using System.IO;
using System.Linq;
using Neo;
using Neo.IO;
using Neo.Network.P2P.Payloads;
using Neo.Persistence;
using Neo.SmartContract;
using Neo.SmartContract.Native;
using Neo.VM;
using Neo.VM.Types;

namespace NEOONE
{
  partial class Dispatcher
  {

    private enum ContainerType
    {
      Block,
      Transaction,
      Signers,
      ConsensusPayload,
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
          case ContainerType.Transaction:
            container = new Transaction();
            break;
          case ContainerType.Signers:
            container = new Signers();
            break;
          case ContainerType.ConsensusPayload:
            container = new ConsensusPayload();
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
      dispose_engine,
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
          return this._create(trigger, container, this.selectSnapshot(args.snapshot, false), gas);

        case EngineMethod.execute:
          return this._execute();

        case EngineMethod.loadscript:
          Script script = new Script((byte[])args.script);
          CallFlags flags = (CallFlags)((byte)args.flags);
          UInt160 scriptHash = null;
          int initialPosition = 0;

          if (args.scriptHash != null)
          {
            scriptHash = UInt160.Parse((string)args.scriptHash);
          }

          if (args.initialPosition != null)
          {
            initialPosition = (int)args.initialPosition;
          }

          return this._loadScript(script, flags, scriptHash, initialPosition);

        case EngineMethod.loadcontract:
          UInt160 contractHash = new UInt160((byte[])args.hash);
          string contractMethod = (string)args.method;
          CallFlags contractFlags = (CallFlags)((byte)args.flags);
          bool packParameters = (bool)args.packParameters;

          return this._loadContract(contractHash, contractMethod, contractFlags, packParameters);

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

        case EngineMethod.dispose_engine:
          this.disposeEngine();

          return true;

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

    private bool _create(TriggerType trigger, IVerifiable container, StoreView snapshot, long gas)
    {
      this.disposeEngine();
      this.engine = ApplicationEngine.Create(trigger, container, snapshot, gas);

      return true;
    }

    private VMState _execute()
    {
      this.isEngineInitialized();
      return this.engine.Execute();
    }

    private bool _loadScript(Script script, CallFlags flags, UInt160 hash = null, int initialPosition = 0)
    {
      this.isEngineInitialized();
      this.engine.LoadScript(script, flags, hash, initialPosition);
      return true;
    }

    private bool _loadContract(UInt160 hash, string method, CallFlags flags, bool packParameters)
    {
      this.isEngineInitialized();
      ContractState cs = NativeContract.Management.GetContract(this.snapshot, hash);
      if (cs is null) return false;

      this.engine.LoadContract(cs, method, flags, packParameters);

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
      return new dynamic[] { };
      // var events = this.engine.Logs;
      // if (events == null || events.Count == 0)
      // {
      //   return new dynamic[] { };
      // }

      // return events.Select((p) => ReturnHelpers.convertLog(p)).ToArray();
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

    public Neo.UInt160[] GetScriptHashesForVerifying(StoreView snapshot)
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
