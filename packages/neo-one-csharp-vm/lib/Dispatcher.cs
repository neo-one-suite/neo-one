using System;
using System.Threading.Tasks;
using Neo.SmartContract;
using System.Dynamic;
using System.Collections.Generic;
using NEOONE.Storage;
using Neo.Persistence;

namespace NEOONE
{
    public partial class Dispatcher
    {

        private ApplicationEngine engine;
        private IStore store;
        private bool init = false;

        private enum BaseMethod
        {
            init,
            dispose,
        }

        private dynamic dispatchBaseMethod(BaseMethod method, dynamic args)
        {
            switch (method)
            {
                case BaseMethod.init:
                    if (args.path == null)
                    {
                        return this._init();
                    }

                    return this._init((string)args.path);

                case BaseMethod.dispose:
                    return this._dispose();

                default:
                    throw new InvalidOperationException();

            }
        }

        private bool _init(string path)
        {
            if (!this.init)
            {
                this.store = new LevelDBStore(path).GetStore();
                this.resetSnapshots();

                this.init = true;
            }

            return this.init;
        }

        private bool _init()
        {
            if (!this.init)
            {
                this.store = new MemoryStore();
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
    }
}
