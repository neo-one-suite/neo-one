/* @flow */
import BN from 'bn.js';
import {
  TRANSACTION_TYPE,
  type Account,
  type ECPoint,
  type ECPointHex,
  type UInt160,
  type UInt160Hex,
  type UInt256Hex,
  type Output,
  type Transaction,
  type ValidatorKey,
  type ValidatorUpdate,
  BinaryReader,
  StateTransaction,
  Validator,
  common,
  utils,
} from '@neo-one/client-core';
import {
  type ValidatorsCountUpdate,
  ValidatorsCount,
} from '@neo-one/node-core';

import _ from 'lodash';
import { utils as commonUtils } from '@neo-one/utils';

import type Blockchain from './Blockchain';
import ValidatorCache from './ValidatorCache';

const processOutput = async (
  blockchain: Blockchain,
  cache: ValidatorCache,
  output: Output,
  negative: boolean,
): Promise<void> => {
  let { value } = output;
  if (negative) {
    value = value.neg();
  }
  const [account] = await Promise.all([
    cache.getAccount(output.address),
    cache.updateAccountBalance(output.address, output.asset, value),
  ]);
  if (
    common.uInt256Equal(
      output.asset,
      blockchain.settings.governingToken.hash,
    ) &&
    account.votes.length > 0
  ) {
    await Promise.all([
      Promise.all(
        account.votes.map(publicKey =>
          cache.updateValidatorVotes(publicKey, value),
        ),
      ),
      cache.updateValidatorsCountVotes(account.votes.length - 1, value),
    ]);
  }
};

const processTransaction = async (
  blockchain: Blockchain,
  cache: ValidatorCache,
  transaction: Transaction,
): Promise<void> => {
  let allOutputs = await Promise.all(
    transaction.inputs.map(async input => {
      const output = await blockchain.output.get(input);
      return { output, negative: true };
    }),
  );
  allOutputs = allOutputs.concat(
    transaction.outputs.map(output => ({ output, negative: false })),
  );
  await Promise.all(
    allOutputs.map(({ output, negative }) =>
      processOutput(blockchain, cache, output, negative),
    ),
  );
  const accountHashes = [
    ...new Set(
      allOutputs.map(({ output }) => common.uInt160ToHex(output.address)),
    ),
  ].map(hash => common.hexToUInt160(hash));
  const touchedValidators = await Promise.all(
    accountHashes.map(async hash => {
      const account = await cache.getAccount(hash);
      return account.votes;
    }),
  );
  const touchedValidatorsSet = [
    ...new Set(
      touchedValidators.reduce(
        (acc, votes) =>
          acc.concat(votes.map(vote => common.ecPointToHex(vote))),
        [],
      ),
    ),
  ].map(publicKey => common.hexToECPoint(publicKey));
  await Promise.all(
    touchedValidatorsSet.map(async publicKey => {
      const validator = await cache.getValidator(publicKey);
      if (!validator.registered && validator.votes.eq(utils.ZERO)) {
        await cache.deleteValidator(publicKey);
      }
    }),
  );
};

export type AccountChanges = {
  [hash: UInt160Hex]: Array<ECPoint>,
};

export type ValidatorVotesChanges = {
  [hash: ECPointHex]: BN,
};

export type ValidatorRegisteredChanges = {
  [hash: ECPointHex]: boolean,
};

export type ValidatorChanges = {
  [hash: ECPointHex]: {
    registered?: boolean,
    votes?: BN,
  },
};

export type ValidatorsCountChanges = Array<BN>;

export const getDescriptorChanges = async ({
  transactions,
  getAccount,
  governingTokenHash,
}: {|
  transactions: Array<StateTransaction>,
  getAccount: (hash: UInt160) => Promise<Account>,
  governingTokenHash: UInt256Hex,
|}): Promise<{|
  accountChanges: AccountChanges,
  validatorChanges: ValidatorChanges,
  validatorsCountChanges: ValidatorsCountChanges,
|}> => {
  const accountChanges = ({}: AccountChanges);
  const validatorVotesChanges = ({}: ValidatorVotesChanges);
  const validatorRegisteredChanges = ({}: ValidatorRegisteredChanges);
  const validatorsCountChanges = ([]: ValidatorsCountChanges);
  const allDescriptors = transactions.reduce(
    (acc, transaction) => acc.concat(transaction.descriptors),
    [],
  );
  const accountDescriptors = allDescriptors.filter(
    descriptor => descriptor.type === 0x40,
  );
  const groupedAccountDescriptors = commonUtils.entries(
    _.groupBy(accountDescriptors, descriptor =>
      common.uInt160ToHex(common.bufferToUInt160(descriptor.key)),
    ),
  );

  await Promise.all(
    groupedAccountDescriptors.map(async ([hash, descriptors]) => {
      const account = await getAccount(common.hexToUInt160(hash));
      const balance = account.getBalance(governingTokenHash);

      for (const vote of account.votes) {
        const voteHex = common.ecPointToHex(vote);
        validatorVotesChanges[voteHex] = (
          validatorVotesChanges[voteHex] || utils.ZERO
        ).sub(balance);
      }

      const descriptor = _.last(descriptors);
      const reader = new BinaryReader(descriptor.value);
      const votes = reader.readArray(() => reader.readECPoint());
      if (votes.length !== account.votes.length) {
        if (account.votes.length > 0) {
          validatorsCountChanges[account.votes.length - 1] = (
            validatorsCountChanges[account.votes.length - 1] || utils.ZERO
          ).sub(balance);
        }

        if (votes.length > 0) {
          validatorsCountChanges[votes.length - 1] = (
            validatorsCountChanges[votes.length - 1] || utils.ZERO
          ).add(balance);
        }
      }

      accountChanges[hash] = votes;
      for (const vote of votes) {
        const voteHex = common.ecPointToHex(vote);
        validatorVotesChanges[voteHex] = (
          validatorVotesChanges[voteHex] || utils.ZERO
        ).add(balance);
      }
    }),
  );

  const validatorDescriptors = allDescriptors.filter(
    descriptor => descriptor.type === 0x48,
  );
  for (const descriptor of validatorDescriptors) {
    const publicKey = common.bufferToECPoint(descriptor.key);
    validatorRegisteredChanges[
      common.ecPointToHex(publicKey)
    ] = descriptor.value.some(byte => byte !== 0);
  }

  const validatorChanges = ({}: ValidatorChanges);
  for (const [publicKey, votes] of commonUtils.entries(validatorVotesChanges)) {
    validatorChanges[publicKey] = { votes };
  }

  for (const [publicKey, registered] of commonUtils.entries(
    validatorRegisteredChanges,
  )) {
    const current = validatorChanges[publicKey] || {};
    validatorChanges[publicKey] = {
      registered,
      votes: current.votes,
    };
  }

  return {
    accountChanges,
    validatorChanges,
    validatorsCountChanges,
  };
};

export const processStateTransaction = async ({
  validatorChanges,
  validatorsCountChanges,
  tryGetValidatorsCount,
  addValidatorsCount,
  updateValidatorsCount,
  tryGetValidator,
  addValidator,
  deleteValidator,
  updateValidator,
}: {|
  validatorChanges: ValidatorChanges,
  validatorsCountChanges: ValidatorsCountChanges,
  tryGetValidatorsCount: () => Promise<?ValidatorsCount>,
  addValidatorsCount: (validatorsCount: ValidatorsCount) => Promise<void>,
  updateValidatorsCount: (
    validatorsCount: ValidatorsCount,
    update: ValidatorsCountUpdate,
  ) => Promise<ValidatorsCount>,
  tryGetValidator: (key: ValidatorKey) => Promise<?Validator>,
  addValidator: (validator: Validator) => Promise<void>,
  deleteValidator: (key: ValidatorKey) => Promise<void>,
  updateValidator: (
    validator: Validator,
    update: ValidatorUpdate,
  ) => Promise<Validator>,
|}): Promise<void> => {
  const validatorsCount = await tryGetValidatorsCount();
  const validatorsCountVotes =
    validatorsCount == null ? [] : validatorsCount.votes;
  for (const [index, value] of validatorsCountChanges.entries()) {
    validatorsCountVotes[index] = value;
  }

  await Promise.all([
    commonUtils
      .entries(validatorChanges)
      .map(async ([publicKeyHex, { registered, votes }]) => {
        const publicKey = common.hexToECPoint(publicKeyHex);
        const validator = await tryGetValidator({ publicKey });
        if (validator == null) {
          await addValidator(
            new Validator({
              publicKey,
              registered,
              votes,
            }),
          );
        } else if (
          ((registered != null && !registered) ||
            (registered == null && !validator.registered)) &&
          ((votes != null && votes.eq(utils.ZERO)) ||
            (votes == null && validator.votes.eq(utils.ZERO)))
        ) {
          await deleteValidator({ publicKey: validator.publicKey });
        } else {
          await updateValidator(validator, { votes, registered });
        }
      }),
    validatorsCount == null
      ? addValidatorsCount(
          new ValidatorsCount({
            votes: validatorsCountVotes,
          }),
        )
      : updateValidatorsCount(validatorsCount, {
          votes: validatorsCountVotes,
        }),
  ]);
};

export default async (
  blockchain: Blockchain,
  transactions: Array<Transaction>,
): Promise<Array<ECPoint>> => {
  const cache = new ValidatorCache(blockchain);
  await Promise.all(
    transactions.map(transaction =>
      processTransaction(blockchain, cache, transaction),
    ),
  );
  const {
    validatorChanges,
    validatorsCountChanges,
  } = await getDescriptorChanges({
    transactions: (transactions.filter(
      transaction =>
        transaction.type === TRANSACTION_TYPE.STATE &&
        transaction instanceof StateTransaction,
    ): $FlowFixMe),
    getAccount: hash => cache.getAccount(hash),
    governingTokenHash: blockchain.settings.governingToken.hashHex,
  });
  await processStateTransaction({
    validatorChanges,
    validatorsCountChanges,
    tryGetValidatorsCount: () => cache.getValidatorsCount(),
    addValidatorsCount: value => cache.addValidatorsCount(value),
    updateValidatorsCount: (value, update) =>
      cache.updateValidatorsCount(update),
    tryGetValidator: key => cache.getValidator(key.publicKey),
    addValidator: validator => cache.addValidator(validator),
    deleteValidator: key => cache.deleteValidator(key.publicKey),
    updateValidator: (value, update) =>
      cache.updateValidator(value.publicKey, update),
  });

  const [validatorsCount, validators] = await Promise.all([
    cache.getValidatorsCount(),
    cache.getAllValidators(),
  ]);

  const numValidators = Math.max(
    utils.weightedAverage(
      utils
        .weightedFilter(
          validatorsCount.votes
            .map((votes, count) => ({ count, votes: votes || utils.ZERO }))
            .filter(({ votes }) => votes.gt(utils.ZERO)),
          0.25,
          0.75,
          ({ count }) => new BN(count),
        )
        .map(([{ count }, weight]) => ({ value: count, weight })),
    ),
    blockchain.settings.standbyValidators.length,
  );

  const standbyValidatorsSet = new Set(
    blockchain.settings.standbyValidators.map(publicKey =>
      common.ecPointToHex(publicKey),
    ),
  );

  const validatorsPublicKeySet = new Set(
    _.take(
      validators
        .filter(
          validator =>
            (validator.registered && validator.votes.gt(utils.ZERO)) ||
            standbyValidatorsSet.has(common.ecPointToHex(validator.publicKey)),
        )
        .sort(
          (aValidator, bValidator) =>
            aValidator.votes.eq(bValidator.votes)
              ? common.ecPointCompare(
                  aValidator.publicKey,
                  bValidator.publicKey,
                )
              : -aValidator.votes.cmp(bValidator.votes),
        )
        .map(validator => common.ecPointToHex(validator.publicKey)),
      numValidators,
    ),
  );

  const standbyValidatorsArray = [...standbyValidatorsSet];
  for (
    let i = 0;
    i < standbyValidatorsArray.length &&
    validatorsPublicKeySet.size < numValidators;
    i += 1
  ) {
    validatorsPublicKeySet.add(standbyValidatorsArray[i]);
  }

  const validatorsPublicKeys = [...validatorsPublicKeySet].map(hex =>
    common.hexToECPoint(hex),
  );

  return validatorsPublicKeys.sort((aKey, bKey) =>
    common.ecPointCompare(aKey, bKey),
  );
};
