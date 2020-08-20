using Neo.Ledger;

// this just mimics the TestBlockchain used in Neo Unit Tests
namespace NEOONE
{
    public class NeoOneBlockchain
    {
        public static readonly Neo.NeoSystem NeoOneSystem;

        static NeoOneBlockchain()
        {
            NeoOneSystem = new Neo.NeoSystem();
            var _ = Blockchain.Singleton;
        }

        public static bool InitializeNeoOneSystem()
        {
            return true;
        }
    }
}
