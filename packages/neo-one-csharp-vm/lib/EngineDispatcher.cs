using System;
using System.Threading.Tasks;
using Neo.Network.P2P.Payloads;
using Neo.Persistence;
using System.Linq;
using Neo.VM;
using Neo.VM.Types;
using Neo.SmartContract;
using Neo.Ledger;
using System.Reflection;

namespace NEOONE
{
    public class EngineDispatcher
    {

        private ApplicationEngine engine;
        private Neo.NeoSystem system;
        private bool init = false;
        public async Task<object> Invoke(dynamic input)
        {
            if (!this.init)
            {
                this.init = NeoOneBlockchain.InitializeNeoOneSystem();
            }

            string method = (string)input.method;

            switch (method)
            {
                // constructor wrapper
                case "create":
                    TriggerType trigger = (TriggerType)input.args.trigger;
                    long gas = (long)input.args.gas;
                    bool testMode = (bool)input.args.testMode;
                    bool snapshotBoolean = input.args.snapshot == null ? false : (bool)input.args.snapshot;
                    var snapshot = snapshotBoolean ? Blockchain.Singleton.GetSnapshot() : null;
                    return this._create(trigger, null, snapshot, gas, testMode);

                // getters
                case "gettrigger":
                    return this._getTrigger();

                case "getvmstate":
                    return this._getVMState();

                case "getresultstack":
                    return this._getResultStack();

                // application engine methods
                case "execute":
                    return this._execute();

                case "loadscript":
                    byte[] rawBytes = (byte[])input.args.script;
                    int scriptPosition = (int)input.args.position;
                    var script = new Script(rawBytes);
                    return this._loadScript(script, scriptPosition);

                // execution engine methods
                case "loadclonedcontext":
                    int position = (int)input.args.position;
                    return this._loadClonedContext(position);

                case "peek":
                    int peekPosition = (int)input.args.position;
                    return this._peek(peekPosition);

                case "pop":
                    return this._pop();

                case "dispose":
                    return this._dispose();

                // internal testing
                case "test":
                    return this._test();

                default:
                    throw new InvalidOperationException($"'{method}' is not a valid method");
            }
        }

        private bool _create(TriggerType trigger, IVerifiable container, StoreView snapshot, long gas, bool testMode = false)
        {
            if (this.engine == null)
            {
                this.engine = ApplicationEngine.Create(trigger, container, snapshot, gas, testMode);
            }

            return true;
        }

        private TriggerType _getTrigger()
        {
            this.isInitialized();
            return this.engine.Trigger;
        }

        private dynamic[] _getResultStack()
        {
            this.isInitialized();
            return this.engine.ResultStack.Select((StackItem p) => ReturnHelpers.convertStackItem(p)).ToArray();
        }

        private VMState _getVMState()
        {
            this.isInitialized();
            return this.engine.State;
        }

        private VMState _execute()
        {
            this.isInitialized();
            return this.engine.Execute();
        }

        private ExecutionContext _loadClonedContext(int initialPosition)
        {
            this.isInitialized();
            return this.engine.LoadClonedContext(initialPosition);
        }

        private bool _loadScript(Script script, int initialPosition)
        {
            this.isInitialized();
            this.engine.LoadScript(script);
            return true;
        }

        private StackItem _peek(int index)
        {
            this.isInitialized();
            return this.engine.Peek(index);
        }

        private StackItem _pop()
        {
            this.isInitialized();
            return this.engine.Pop();
        }

        private dynamic _test()
        {
            var entry = Assembly.GetEntryAssembly();

            return entry;
        }

        private bool _dispose()
        {
            this.isInitialized();
            this.engine.Dispose();
            return true;
        }

        private bool isInitialized()
        {
            if (this.engine == null)
            {
                throw new InvalidOperationException("Can't invoke a method without creating the engine");
            }

            return true;
        }
    }
}
