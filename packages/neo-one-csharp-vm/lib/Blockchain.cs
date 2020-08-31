using Neo.Ledger;

// this just mimics the TestBlockchain used in Neo Unit Tests
namespace NEOONE
{
    public class NeoOneBlockchain
    {

        private static readonly Neo.NeoSystem system;

        static NeoOneBlockchain()
        {
            system = new Neo.NeoSystem();
            var _ = Blockchain.Singleton;
        }

        public static bool InitializeNeoOneSystem()
        {
            return true;
        }
    }
}
