using System;
using System.Threading.Tasks;
using Neo.SmartContract;
using System.Dynamic;
using System.Collections.Generic;

namespace NEOONE
{
    public partial class Dispatcher
    {

        private ApplicationEngine engine;
        private bool init = false;

        private enum BaseMethod
        {
            init,
            dispose,
            test,
        }

        private dynamic dispatchBaseMethod(BaseMethod method)
        {
            switch (method)
            {
                case BaseMethod.init:
                    return this._init();

                case BaseMethod.dispose:
                    return this._dispose();

                case BaseMethod.test:
                    return this._test();

                default:
                    throw new InvalidOperationException();

            }
        }

        private bool _init()
        {
            this.init = this.init ? true : NeoOneBlockchain.InitializeNeoOneSystem();
            this.resetSnapshots();

            return true;
        }

        private dynamic _test()
        {
            return true;
        }

        private bool _dispose()
        {
            this.snapshot = null;
            this.clonedSnapshot = null;
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
                return this.dispatchBaseMethod(baseMethod);
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
