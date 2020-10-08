import { FeelessTransactionModel, TransactionFeesAdd } from './FeelessTransactionModel';
import { TransactionModel } from './TransactionModel';

const addFees = (tx: FeelessTransactionModel, fees: TransactionFeesAdd): TransactionModel =>
  new TransactionModel({
    version: tx.version,
    attributes: tx.attributes,
    signers: tx.signers,
    script: tx.script,
    witnesses: tx.witnesses,
    nonce: tx.nonce,
    validUntilBlock: tx.validUntilBlock,
    systemFee: fees.systemFee,
    networkFee: fees.networkFee,
  });

export const helper = {
  addFees,
};
