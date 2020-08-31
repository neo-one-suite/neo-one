using System;
using System.IO;
using Neo;
using Neo.Ledger;
using Neo.Network.P2P.Payloads;
using Neo.Persistence;
using Neo.VM;

namespace NEOONE
{
    partial class Dispatcher
    {

        private StoreView snapshot;
        private StoreView clonedSnapshot;

        enum SnapshotMethod
        {
            snapshot_blocks_add,
            snapshot_transactions_add,
            snapshot_clone,
            snapshot_set_height,
            snapshot_commit,
            snapshot_reset,
        }

        private dynamic dispatchSnapshotMethod(SnapshotMethod method, dynamic args)
        {
            switch (method)
            {
                case SnapshotMethod.snapshot_blocks_add:
                    UInt256 blockHash = new UInt256((byte[])args.hash);
                    byte[] blockSerialized = (byte[])args.block;
                    Block block = new Block();
                    using (MemoryStream ms = new MemoryStream(blockSerialized))
                    using (BinaryReader reader = new BinaryReader(ms))
                    {
                        block.Deserialize(reader);
                    }

                    return this._snapshotBlocksAdd(this.selectSnapshot(args.snapshot), blockHash, block);

                case SnapshotMethod.snapshot_transactions_add:
                    uint blockIndex = (uint)args.index;
                    byte[] txSerialized = (byte[])args.tx;
                    Transaction tx = new Transaction();
                    using (MemoryStream ms = new MemoryStream(txSerialized))
                    using (BinaryReader reader = new BinaryReader(ms))
                    {

                        ((IVerifiable)tx).Deserialize(reader);
                    }

                    return this._snapshotTransactionsAdd(this.selectSnapshot(args.snapshot), tx, blockIndex);

                case SnapshotMethod.snapshot_clone:
                    return this._snapshotClone();

                case SnapshotMethod.snapshot_set_height:
                    uint index = (uint)args.index;
                    return this._snapshotSetHeight(this.selectSnapshot(args.snapshot), index);

                case SnapshotMethod.snapshot_commit:
                    this.selectCommitStore(
                      this.selectSnapshot(args.snapshot, false),
                      args.partial
                    ).Commit();

                    return true;

                case SnapshotMethod.snapshot_reset:
                    this.resetSnapshots();

                    return true;

                default:
                    throw new InvalidOperationException();
            }
        }


        private void resetSnapshots()
        {
            this.snapshot = Blockchain.Singleton.GetSnapshot();
            this.clonedSnapshot = this.snapshot.Clone();
        }

        private StoreView selectSnapshot(string snapshot, bool required = true)
        {
            switch (snapshot)
            {
                case "main":
                    return this.snapshot;
                case "clone":
                    return this.clonedSnapshot;
                default:
                    if (required) throw new InvalidOperationException("Must specify snapshot for this method");
                    return null;
            }
        }

        private CommitStore selectCommitStore(StoreView snapshot, string partial)
        {
            switch (partial)
            {
                case "blocks":
                    return (CommitStore)snapshot.Blocks;
                case "transactions":
                    return (CommitStore)snapshot.Transactions;
                default:
                    return (CommitStore)snapshot;
            }
        }

        private bool _snapshotBlocksAdd(StoreView snapshot, UInt256 hash, Block block)
        {
            snapshot.Blocks.Add(hash, block.Trim());

            return true;
        }

        private bool _snapshotTransactionsAdd(StoreView snapshot, Transaction tx, uint index, VMState vmState = VMState.BREAK)
        {
            var state = new TransactionState { BlockIndex = index, Transaction = tx, VMState = vmState };
            snapshot.Transactions.Add(tx.Hash, state);

            return true;
        }

        private bool _snapshotSetHeight(StoreView snapshot, uint index)
        {
            var height = snapshot.BlockHashIndex.GetAndChange();
            height.Index = index;

            return true;
        }

        private bool _snapshotClone()
        {
            this.clonedSnapshot = this.snapshot.Clone();

            return true;
        }
    }

}
