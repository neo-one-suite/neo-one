import { UInt256 } from '../common';
import {
  createDeserializeWire,
  DeserializeWire,
  DeserializeWireBaseOptions,
} from '../Serializable';
import { ClaimTransaction } from './ClaimTransaction';
import { ClaimTransactionJSON } from './ClaimTransaction';
import { ContractTransactionJSON } from './ContractTransaction';
import { ContractTransaction } from './ContractTransaction';
import { EnrollmentTransactionJSON } from './EnrollmentTransaction';
import { EnrollmentTransaction } from './EnrollmentTransaction';
import { InvocationTransaction } from './InvocationTransaction';
import { InvocationTransactionJSON } from './InvocationTransaction';
import { IssueTransactionJSON } from './IssueTransaction';
import { IssueTransaction } from './IssueTransaction';
import { MinerTransactionJSON } from './MinerTransaction';
import { MinerTransaction } from './MinerTransaction';
import { PublishTransaction } from './PublishTransaction';
import { PublishTransactionJSON } from './PublishTransaction';
import { RegisterTransaction } from './RegisterTransaction';
import { RegisterTransactionJSON } from './RegisterTransaction';
import { StateTransaction } from './StateTransaction';
import { StateTransactionJSON } from './StateTransaction';
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
