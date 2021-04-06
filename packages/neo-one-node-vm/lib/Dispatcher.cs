using System;
using System.Threading.Tasks;
using Neo.SmartContract;
using System.Dynamic;
using System.Collections.Generic;
using Neo.Persistence;
using Microsoft.Extensions.Configuration;
using Neo.SmartContract.Native;

namespace NEOONE
{
  public partial class Dispatcher
  {

    private ApplicationEngine engine;
    private IStore store;
    private bool init = false;
    private string path;
    private enum BaseMethod
    {
      init,
      dispose,
      test,
      get_config,
    }

    private dynamic dispatchBaseMethod(BaseMethod method, dynamic args)
    {
      switch (method)
      {
        case BaseMethod.init:
          if (args.path == null && args.settings == null)
          {
            return this._init();
          }
          if (args.path == null && args.settings != null)
          {
            return this._init(parseConfig(args.settings));
          }
          if (args.path != null && args.settings == null)
          {
            return this._init((string)args.path);
          }

          return this._init((string)args.path, parseConfig(args.settings));

        case BaseMethod.dispose:
          return this._dispose();

        case BaseMethod.get_config:
          return this._getConfig();

        case BaseMethod.test:
          return this._test();

        default:
          throw new InvalidOperationException();

      }
    }

    private bool _init(string path, IConfigurationSection config)
    {
      if (!this.init)
      {
        Neo.ProtocolSettings.Load(config);
        this.path = path;
        this.resetSnapshots();

        this.init = true;
      }

      return this.init;
    }

    private bool _init(IConfigurationSection config)
    {
      if (!this.init)
      {
        Neo.ProtocolSettings.Load(config);
        this.resetSnapshots();

        this.init = true;
      }

      return this.init;
    }

    private bool _init(string path)
    {
      if (!this.init)
      {
        this.path = path;
        this.resetSnapshots();

        this.init = true;
      }

      return this.init;
    }

    public bool _init()
    {
      if (!this.init)
      {
        this.resetSnapshots();

        this.init = true;
      }

      return this.init;
    }

    private bool _dispose()
    {
      this.snapshot = null;
      this.clonedSnapshot = null;
      this.store.Dispose();
      this.store = null;
      this.disposeEngine();
      this.init = false;

      return true;
    }

    public dynamic _test()
    {
      return NativeContract.NEO.Name;
    }

    private NEOONE.ReturnHelpers.ProtocolSettingsReturn _getConfig()
    {
      return new NEOONE.ReturnHelpers.ProtocolSettingsReturn(Neo.ProtocolSettings.Default);
    }

#pragma warning disable 1998
    public async Task<object> Invoke(dynamic input)
    {
      string method = (string)input.method;
      if (!this.init && method != "init")
      {
        throw new InvalidOperationException("Dispatcher must be initalized");
      }

      object args = hasArgs(input) ? input.args : null;

      BaseMethod baseMethod;
      if (Enum.TryParse<BaseMethod>(method, out baseMethod))
      {
        return this.dispatchBaseMethod(baseMethod, args);
      }

      EngineMethod engineMethod;
      if (Enum.TryParse<EngineMethod>(method, out engineMethod))
      {
        return this.dispatchEngineMethod(engineMethod, args);
      }

      SnapshotMethod snapshotMethod;
      if (Enum.TryParse<SnapshotMethod>(method, out snapshotMethod))
      {
        return this.dispatchSnapshotMethod(snapshotMethod, args);
      }

      TestMethod testMethod;
      if (Enum.TryParse<TestMethod>(method, out testMethod))
      {
        return this.dispatchTestMethod(testMethod, args);
      }

      throw new ArgumentException($"{method} is not a valid dispatch method");
    }

    private bool hasArgs(dynamic input)
    {
      Type inputType = input.GetType();

      if (inputType == typeof(ExpandoObject))
      {
        return ((IDictionary<string, object>)input).ContainsKey("args");
      }

      return inputType.GetProperty("args") != null;
    }

    private IConfigurationSection parseConfig(dynamic input)
    {
      Dictionary<string, string> config = new Dictionary<string, string> { };
      if (input.magic != null)
      {
        uint Magic = (uint)input.magic;
        config.Add("ProtocolConfiguration:Magic", Magic.ToString());
      }
      if (input.addressVersion != null)
      {
        byte AddressVersion = (byte)input.addressVersion;
        config.Add("ProtocolConfiguration:AddressVersion", AddressVersion.ToString());
      }
      if (input.standbyCommittee != null)
      {
        object[] StandbyCommittee = (object[])input.standbyCommittee;
        int idx = 0;
        foreach (object member in StandbyCommittee)
        {
          config.Add($"ProtocolConfiguration:StandbyCommittee:{idx}", member.ToString());
          idx++;
        }
      }
      if (input.committeeMembersCount != null)
      {
        int CommitteeMembersCount = (int)input.committeeMembersCount;
        config.Add("ProtocolConfiguration:CommitteeMembersCount", CommitteeMembersCount.ToString());
      }
      if (input.validatorsCount != null)
      {
        int ValidatorsCount = (int)input.validatorsCount;
        config.Add("ProtocolConfiguration:ValidatorsCount", ValidatorsCount.ToString());
      }
      if (input.millisecondsPerBlock != null)
      {
        uint MillisecondsPerBlock = (uint)input.millisecondsPerBlock;
        config.Add("ProtocolConfiguration:MillisecondsPerBlock", MillisecondsPerBlock.ToString());
      }
      if (input.memoryPoolMaxTransactions != null)
      {
        int MemoryPoolMaxTransactions = (int)input.memoryPoolMaxTransactions;
        config.Add("ProtocolConfiguration:MemoryPoolMaxTransactions", MemoryPoolMaxTransactions.ToString());
      }
      if (input.maxTraceableBlocks != null)
      {
        int MaxTraceableBlocks = (int)input.maxTraceableBlocks;
        config.Add("ProtocolConfiguration:MaxTraceableBlocks", MaxTraceableBlocks.ToString());
      }
      if (input.maxTransactionsPerBlock != null)
      {
        int MaxTransactionsPerBlock = (int)input.maxTransactionsPerBlock;
        config.Add("ProtocolConfiguration:MaxTransactionsPerBlock", MaxTransactionsPerBlock.ToString());
      }

      return new ConfigurationBuilder().AddInMemoryCollection(config).Build().GetSection("ProtocolConfiguration");
    }
  }
}
