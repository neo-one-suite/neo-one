/* @flow */
import {
  InvalidTransactionTypeError,
  assertTransactionType,
} from './TransactionType';
import {
  type DeserializeWire,
  type DeserializeWireBaseOptions,
  createDeserializeWire,
} from '../Serializable';
import { type UInt256 } from '../common';

import MinerTransaction from './MinerTransaction';
import IssueTransaction from './IssueTransaction';
import ClaimTransaction from './ClaimTransaction';
import EnrollmentTransaction from './EnrollmentTransaction';
import RegisterTransaction from './RegisterTransaction';
import ContractTransaction from './ContractTransaction';
import PublishTransaction from './PublishTransaction';
import StateTransaction from './StateTransaction';
import InvocationTransaction from './InvocationTransaction';

import type { MinerTransactionJSON } from './MinerTransaction';
import type { IssueTransactionJSON } from './IssueTransaction';
import type { ClaimTransactionJSON } from './ClaimTransaction';
import type { EnrollmentTransactionJSON } from './EnrollmentTransaction';
import type { RegisterTransactionJSON } from './RegisterTransaction';
import type { ContractTransactionJSON } from './ContractTransaction';
import type { PublishTransactionJSON } from './PublishTransaction';
import type { StateTransactionJSON } from './StateTransaction';
import type { InvocationTransactionJSON } from './InvocationTransaction';

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

export type TransactionReceiptJSON = {|
  blockIndex: number,
  blockHash: string,
  transactionIndex: number,
|};

export type TransactionKey = {| hash: UInt256 |};

export const deserializeWireBase = (
  options: DeserializeWireBaseOptions,
): Transaction => {
  const { reader } = options;
  const type = assertTransactionType(reader.clone().readUInt8());
  switch (type) {
    case 0x00:
      return MinerTransaction.deserializeWireBase(options);
    case 0x01:
      return IssueTransaction.deserializeWireBase(options);
    case 0x02:
      return ClaimTransaction.deserializeWireBase(options);
    case 0x20:
      return EnrollmentTransaction.deserializeWireBase(options);
    case 0x40:
      return RegisterTransaction.deserializeWireBase(options);
    case 0x80:
      return ContractTransaction.deserializeWireBase(options);
    case 0x90:
      return StateTransaction.deserializeWireBase(options);
    case 0xd0:
      return PublishTransaction.deserializeWireBase(options);
    case 0xd1:
      return InvocationTransaction.deserializeWireBase(options);
    default:
      // eslint-disable-next-line
      (type: empty);
      throw new InvalidTransactionTypeError(type);
  }
};

export const deserializeWire: DeserializeWire<
  Transaction,
> = createDeserializeWire(deserializeWireBase);
