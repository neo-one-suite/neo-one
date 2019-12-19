// import { assertTransactionType, UInt256 } from '@neo-one/client-common';
// import { utils } from '@neo-one/utils';
// import { createDeserializeWire, DeserializeWireBaseOptions } from '../Serializable';
// import { ClaimTransaction } from './ClaimTransaction';
// import { ContractTransaction } from './ContractTransaction';
// import { EnrollmentTransaction } from './EnrollmentTransaction';
// import { InvocationTransaction } from './InvocationTransaction';
// import { IssueTransaction } from './IssueTransaction';
// import { MinerTransaction } from './MinerTransaction';
// import { PublishTransaction } from './PublishTransaction';
// import { RegisterTransaction } from './RegisterTransaction';
// import { StateTransaction } from './StateTransaction';
// import { TransactionType } from './TransactionType';

// export type Transaction =
//   | MinerTransaction
//   | IssueTransaction
//   | ClaimTransaction
//   | EnrollmentTransaction
//   | RegisterTransaction
//   | ContractTransaction
//   | PublishTransaction
//   | StateTransaction
//   | InvocationTransaction;

// export interface TransactionKey {
//   readonly hash: UInt256;
// }

// export const deserializeTransactionWireBase = (options: DeserializeWireBaseOptions): Transaction => {
//   const { reader } = options;
//   const type = assertTransactionType(reader.clone().readUInt8());
//   switch (type) {
//     case TransactionType.Miner:
//       return MinerTransaction.deserializeWireBase(options);
//     case TransactionType.Issue:
//       return IssueTransaction.deserializeWireBase(options);
//     case TransactionType.Claim:
//       return ClaimTransaction.deserializeWireBase(options);
//     case TransactionType.Enrollment:
//       return EnrollmentTransaction.deserializeWireBase(options);
//     case TransactionType.Register:
//       return RegisterTransaction.deserializeWireBase(options);
//     case TransactionType.Contract:
//       return ContractTransaction.deserializeWireBase(options);
//     case TransactionType.State:
//       return StateTransaction.deserializeWireBase(options);
//     case TransactionType.Publish:
//       return PublishTransaction.deserializeWireBase(options);
//     case TransactionType.Invocation:
//       return InvocationTransaction.deserializeWireBase(options);
//     default:
//       utils.assertNever(type);
//       throw new Error('For TS');
//   }
// };

// export const deserializeTransactionWire = createDeserializeWire(deserializeTransactionWireBase);
