import { Observable } from 'rxjs';
import { Block } from './Block';
import { Header } from './Header';
import { DeserializeWireContext, SerializeJSONContext } from './Serializable';
import { BlockchainSettings } from './Settings';
import { BlockchainStorage } from './Storage';
import { Transaction } from './transaction';
import { VerifyWitnesses } from './Verifiable';

// tslint:disable-next-line: no-any TODO: implement something here
type CallReceipt = any;

export interface Blockchain extends BlockchainStorage {
  readonly settings: BlockchainSettings;
  readonly deserializeWireContext: DeserializeWireContext;
  // readonly serializeJSONContext: SerializeJSONContext;
  // readonly feeContext: FeeContext;

  readonly currentBlock: Block;
  readonly previousBlock: Block | undefined;
  readonly currentHeaderIndex: number;
  readonly currentBlockIndex: number;
  readonly block$: Observable<Block>;
  readonly isPersistingBlock: boolean;

  readonly persistBlock: (options: { readonly block: Block; readonly unsafe?: boolean }) => Promise<void>;
  // readonly persistHeaders: (headers: readonly Header[]) => Promise<void>;

  readonly verifyWitnesses: VerifyWitnesses;

  readonly invokeScript: (script: Buffer) => CallReceipt;
  readonly invokeTransaction: <TTransaction extends { readonly script: Buffer }>(
    transaction: TTransaction,
    gas: number,
  ) => CallReceipt;

  // readonly updateSettings: (settings: BlockchainSettings) => void;
  readonly stop: () => Promise<void>;
  readonly reset: () => Promise<void>;
}
