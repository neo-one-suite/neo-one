import { assertTransactionType, TransactionType } from './TransactionType';
import {
  DeserializeWire,
  DeserializeWireBaseOptions,
  createDeserializeWire,
} from '../Serializable';
import { UInt256 } from '../common';
import { MinerTransaction } from './MinerTransaction';
import { IssueTransaction } from './IssueTransaction';
import { ClaimTransaction } from './ClaimTransaction';
import { EnrollmentTransaction } from './EnrollmentTransaction';
import { RegisterTransaction } from './RegisterTransaction';
import { ContractTransaction } from './ContractTransaction';
import { PublishTransaction } from './PublishTransaction';
import { StateTransaction } from './StateTransaction';
import { InvocationTransaction } from './InvocationTransaction';
import { MinerTransactionJSON } from './MinerTransaction';
import { IssueTransactionJSON } from './IssueTransaction';
import { ClaimTransactionJSON } from './ClaimTransaction';
import { EnrollmentTransactionJSON } from './EnrollmentTransaction';
import { RegisterTransactionJSON } from './RegisterTransaction';
import { ContractTransactionJSON } from './ContractTransaction';
import { PublishTransactionJSON } from './PublishTransaction';
import { StateTransactionJSON } from './StateTransaction';
import { InvocationTransactionJSON } from './InvocationTransaction';

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
  blockIndex: number;
  blockHash: string;
  transactionIndex: number;
}

export interface TransactionKey {
  hash: UInt256;
}

export const deserializeTransactionWireBase = (
  options: DeserializeWireBaseOptions,
): Transaction => {
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
  }
};

export const deserializeTransactionWire: DeserializeWire<
  Transaction
> = createDeserializeWire(deserializeTransactionWireBase);
