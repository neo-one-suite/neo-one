using System;
using System.IO;
using System.Linq;
using Neo;
using Neo.Ledger;
using Neo.Network.P2P.Payloads;
using Neo.Persistence;
using Neo.VM;
using NEOONE.Storage;

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
            snapshot_commit,
            snapshot_reset,
            snapshot_change_block_hash_index,
            snapshot_change_header_hash_index,
            snapshot_set_persisting_block,
            snapshot_get_change_set,
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

                case SnapshotMethod.snapshot_change_block_hash_index:
                    uint bIndex = (uint)args.index;
                    UInt256 blockChangeHash = new UInt256((byte[])args.hash);

                    return this._snapshotChangeBlockHashIndex(this.selectSnapshot(args.snapshot), bIndex, blockChangeHash);

                case SnapshotMethod.snapshot_change_header_hash_index:
                    uint hIndex = (uint)args.index;
                    UInt256 headerChangeHash = new UInt256((byte[])args.hash);

                    return this._snapshotChangeHeaderHashIndex(this.selectSnapshot(args.snapshot), hIndex, headerChangeHash);

                case SnapshotMethod.snapshot_get_change_set:
                    return this._snapshotGetChangeSet(this.selectSnapshot(args.snapshot, true));


                case SnapshotMethod.snapshot_commit:
                    this._snapshotCommit(
                      this.selectSnapshot(args.snapshot),
                      args.partial
                    );

                    return true;

                case SnapshotMethod.snapshot_set_persisting_block:
                    byte[] persistingBlockSerialized = (byte[])args.block;
                    Block persisting = new Block();
                    using (MemoryStream ms = new MemoryStream(persistingBlockSerialized))
                    using (BinaryReader reader = new BinaryReader(ms))
                    {
                        persisting.Deserialize(reader);
                    }

                    this.selectSnapshot(args.snapshot).PersistingBlock = persisting;

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
            this.snapshot = new SnapshotView(this.store);
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

        private void _snapshotCommit(SnapshotView snapshot, string partial)
        {
            switch (partial)
            {
                case "blocks":
                    snapshot.Blocks.Commit();
                    break;
                case "transactions":
                    snapshot.Transactions.Commit();
                    break;
                default:
                    snapshot.Commit();
                    break;
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

        private bool _snapshotChangeBlockHashIndex(StoreView snapshot, uint index, UInt256 hash)
        {
            var hashIndex = snapshot.BlockHashIndex.GetAndChange();
            hashIndex.Index = index;
            hashIndex.Hash = hash;

            return true;
        }

        private bool _snapshotChangeHeaderHashIndex(StoreView snapshot, uint index, UInt256 hash)
        {
            var hashIndex = snapshot.HeaderHashIndex.GetAndChange();
            hashIndex.Index = index;
            hashIndex.Hash = hash;

            return true;
        }

        private dynamic _snapshotGetChangeSet(SnapshotView snapshot)
        {
            return new ChangeSet(snapshot).set.ToArray();
        }

        private bool _snapshotClone()
        {
            this.clonedSnapshot = this.snapshot.Clone();

            return true;
        }
    }

}
