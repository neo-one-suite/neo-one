import { utils } from '@neo-one/utils';
import { UInt256 } from '../common';
import { createDeserializeWire, DeserializeWireBaseOptions } from '../Serializable';
import { ClaimTransaction, ClaimTransactionJSON } from './ClaimTransaction';
import { ContractTransaction, ContractTransactionJSON } from './ContractTransaction';
import { EnrollmentTransaction, EnrollmentTransactionJSON } from './EnrollmentTransaction';
import { InvocationTransaction, InvocationTransactionJSON } from './InvocationTransaction';
import { IssueTransaction, IssueTransactionJSON } from './IssueTransaction';
import { MinerTransaction, MinerTransactionJSON } from './MinerTransaction';
import { PublishTransaction, PublishTransactionJSON } from './PublishTransaction';
import { RegisterTransaction, RegisterTransactionJSON } from './RegisterTransaction';
import { StateTransaction, StateTransactionJSON } from './StateTransaction';
import { assertTransactionType, TransactionType } from './TransactionType';

export type Transaction =
  | MinerTransaction
  | IssueTransaction
  | ClaimTransaction
  | EnrollmentTransaction
  | RegisterTransaction
  | ContractTransaction
  | PublishTransaction
  | StateTransaction
  | InvocationTransaction;

export type TransactionJSON =
  | MinerTransactionJSON
  | IssueTransactionJSON
  | ClaimTransactionJSON
  | EnrollmentTransactionJSON
  | RegisterTransactionJSON
  | ContractTransactionJSON
  | PublishTransactionJSON
  | StateTransactionJSON
  | InvocationTransactionJSON;

export interface TransactionReceiptJSON {
  readonly blockIndex: number;
  readonly blockHash: string;
  readonly transactionIndex: number;
}

export interface TransactionKey {
  readonly hash: UInt256;
}

export const deserializeTransactionWireBase = (options: DeserializeWireBaseOptions): Transaction => {
  const { reader } = options;
  const type = assertTransactionType(reader.clone().readUInt8());
  switch (type) {
    case TransactionType.Miner:
      return MinerTransaction.deserializeWireBase(options);
    case TransactionType.Issue:
      return IssueTransaction.deserializeWireBase(options);
    case TransactionType.Claim:
      return ClaimTransaction.deserializeWireBase(options);
    case TransactionType.Enrollment:
      return EnrollmentTransaction.deserializeWireBase(options);
    case TransactionType.Register:
      return RegisterTransaction.deserializeWireBase(options);
    case TransactionType.Contract:
      return ContractTransaction.deserializeWireBase(options);
    case TransactionType.State:
      return StateTransaction.deserializeWireBase(options);
    case TransactionType.Publish:
      return PublishTransaction.deserializeWireBase(options);
    case TransactionType.Invocation:
      return InvocationTransaction.deserializeWireBase(options);
    default:
      utils.assertNever(type);
      throw new Error('For TS');
  }
};

export const deserializeTransactionWire = createDeserializeWire(deserializeTransactionWireBase);
