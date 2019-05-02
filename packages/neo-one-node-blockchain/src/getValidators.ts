// tslint:disable no-object-mutation no-array-mutation no-loop-statement
import { common, ECPoint, UInt160, UInt256Hex } from '@neo-one/client-common';
import {
  Account,
  BinaryReader,
  Output,
  StateDescriptor,
  StateTransaction,
  Transaction,
  TransactionType,
  utils,
  Validator,
  ValidatorKey,
  ValidatorsCount,
  ValidatorsCountUpdate,
  ValidatorUpdate,
} from '@neo-one/node-core';
import BN from 'bn.js';
import _ from 'lodash';
import { Blockchain } from './Blockchain';
import { ValidatorCache } from './ValidatorCache';

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

  if (common.uInt256Equal(output.asset, blockchain.settings.governingToken.hash) && account.votes.length > 0) {
    await Promise.all([
      Promise.all(account.votes.map(async (publicKey) => cache.updateValidatorVotes(publicKey, value))),

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
    transaction.inputs.map(async (input) => {
      const output = await blockchain.output.get(input);

      return { output, negative: true };
    }),
  );

  allOutputs = allOutputs.concat(transaction.outputs.map((output) => ({ output, negative: false })));

  await Promise.all(allOutputs.map(async ({ output, negative }) => processOutput(blockchain, cache, output, negative)));

  const accountHashes = [...new Set(allOutputs.map(({ output }) => common.uInt160ToHex(output.address)))].map((hash) =>
    common.hexToUInt160(hash),
  );
  const touchedValidators = await Promise.all(
    accountHashes.map(async (hash) => {
      const account = await cache.getAccount(hash);

      return account.votes;
    }),
  );

  const touchedValidatorsSet = [
    ...new Set(
      touchedValidators.reduce<readonly string[]>(
        (acc, votes) => acc.concat(votes.map((vote) => common.ecPointToHex(vote))),
        [],
      ),
    ),
  ].map((publicKey) => common.hexToECPoint(publicKey));
  await Promise.all(
    touchedValidatorsSet.map(async (publicKey) => {
      const validator = await cache.getValidator(publicKey);
      if (!validator.registered && validator.votes.eq(utils.ZERO)) {
        await cache.deleteValidator(publicKey);
      }
    }),
  );
};

// tslint:disable readonly-keyword readonly-array
export interface AccountChanges {
  [hash: string]: readonly ECPoint[];
}
export interface ValidatorVotesChanges {
  [hash: string]: BN;
}
export interface ValidatorRegisteredChanges {
  [hash: string]: boolean;
}
interface ValidatorChange {
  readonly registered?: boolean;
  readonly votes?: BN;
}
export interface ValidatorChanges {
  [hash: string]: ValidatorChange;
}
export type ValidatorsCountChanges = BN[];
// tslint:enable readonly-keyword readonly-array

export const getDescriptorChanges = async ({
  transactions,
  getAccount,
  governingTokenHash,
}: {
  readonly transactions: readonly StateTransaction[];
  readonly getAccount: (hash: UInt160) => Promise<Account>;
  readonly governingTokenHash: UInt256Hex;
}): Promise<{
  readonly accountChanges: AccountChanges;
  readonly validatorChanges: ValidatorChanges;
  readonly validatorsCountChanges: ValidatorsCountChanges;
}> => {
  const accountChanges: AccountChanges = {};
  const validatorVotesChanges: ValidatorVotesChanges = {};
  const validatorRegisteredChanges: ValidatorRegisteredChanges = {};
  const validatorsCountChanges: ValidatorsCountChanges = [];
  const allDescriptors = transactions.reduce<readonly StateDescriptor[]>(
    (acc, transaction) => acc.concat(transaction.descriptors),
    [],
  );

  const accountDescriptors = allDescriptors.filter((descriptor) => descriptor.type === 0x40);

  const groupedAccountDescriptors = Object.entries(
    _.groupBy(accountDescriptors, (descriptor) => common.uInt160ToHex(common.bufferToUInt160(descriptor.key))),
  );

  await Promise.all(
    groupedAccountDescriptors.map(async ([hash, descriptors]) => {
      const account = await getAccount(common.hexToUInt160(hash));
      const balance = account.getBalance(governingTokenHash);

      // tslint:disable-next-line no-loop-statement
      for (const vote of account.votes) {
        const voteHex = common.ecPointToHex(vote);
        validatorVotesChanges[voteHex] = ((validatorVotesChanges[voteHex] as BN | undefined) === undefined
          ? utils.ZERO
          : validatorVotesChanges[voteHex]
        ).sub(balance);
      }

      const descriptor = descriptors[descriptors.length - 1];
      const reader = new BinaryReader(descriptor.value);
      const votes = reader.readArray(() => reader.readECPoint());
      if (votes.length !== account.votes.length) {
        if (account.votes.length > 0) {
          validatorsCountChanges[account.votes.length - 1] = ((validatorsCountChanges[account.votes.length - 1] as
            | BN
            | undefined) === undefined
            ? utils.ZERO
            : validatorsCountChanges[account.votes.length - 1]
          ).sub(balance);
        }

        if (votes.length > 0) {
          validatorsCountChanges[votes.length - 1] = ((validatorsCountChanges[votes.length - 1] as BN | undefined) ===
          undefined
            ? utils.ZERO
            : validatorsCountChanges[votes.length - 1]
          ).add(balance);
        }
      }

      accountChanges[hash] = votes;
      for (const vote of votes) {
        const voteHex = common.ecPointToHex(vote);
        validatorVotesChanges[voteHex] = ((validatorVotesChanges[voteHex] as BN | undefined) === undefined
          ? utils.ZERO
          : validatorVotesChanges[voteHex]
        ).add(balance);
      }
    }),
  );

  const validatorDescriptors = allDescriptors.filter((descriptor) => descriptor.type === 0x48);

  for (const descriptor of validatorDescriptors) {
    const publicKey = common.bufferToECPoint(descriptor.key);
    validatorRegisteredChanges[common.ecPointToHex(publicKey)] = descriptor.value.some((byte) => byte !== 0);
  }

  const validatorChanges: ValidatorChanges = {};
  for (const [publicKey, votes] of Object.entries(validatorVotesChanges)) {
    validatorChanges[publicKey] = { votes };
  }

  for (const [publicKey, registered] of Object.entries(validatorRegisteredChanges)) {
    const current =
      (validatorChanges[publicKey] as ValidatorChange | undefined) === undefined ? {} : validatorChanges[publicKey];
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
}: {
  readonly validatorChanges: ValidatorChanges;
  readonly validatorsCountChanges: ValidatorsCountChanges;
  readonly tryGetValidatorsCount: () => Promise<ValidatorsCount | undefined>;
  readonly addValidatorsCount: (validatorsCount: ValidatorsCount) => Promise<void>;
  readonly updateValidatorsCount: (validatorsCount: ValidatorsCount, update: ValidatorsCountUpdate) => Promise<void>;

  readonly tryGetValidator: (key: ValidatorKey) => Promise<Validator | undefined>;
  readonly addValidator: (validator: Validator) => Promise<void>;
  readonly deleteValidator: (key: ValidatorKey) => Promise<void>;
  readonly updateValidator: (validator: Validator, update: ValidatorUpdate) => Promise<Validator>;
}): Promise<void> => {
  const validatorsCount = await tryGetValidatorsCount();
  const mutableValidatorsCountVotes = validatorsCount === undefined ? [] : [...validatorsCount.votes];
  [...validatorsCountChanges.entries()].forEach(([index, value]) => {
    mutableValidatorsCountVotes[index] = value;
  });

  await Promise.all([
    Promise.all(
      Object.entries(validatorChanges).map(async ([publicKeyHex, { registered, votes }]) => {
        const publicKey = common.hexToECPoint(publicKeyHex);
        const validator = await tryGetValidator({ publicKey });
        if (validator === undefined) {
          await addValidator(
            new Validator({
              publicKey,
              registered,
              votes,
            }),
          );
        } else if (
          ((registered !== undefined && !registered) || (registered === undefined && !validator.registered)) &&
          ((votes !== undefined && votes.eq(utils.ZERO)) || (votes === undefined && validator.votes.eq(utils.ZERO)))
        ) {
          await deleteValidator({ publicKey: validator.publicKey });
        } else {
          await updateValidator(validator, { votes, registered });
        }
      }),
    ),
    validatorsCount === undefined
      ? addValidatorsCount(
          new ValidatorsCount({
            votes: mutableValidatorsCountVotes,
          }),
        )
      : updateValidatorsCount(validatorsCount, {
          votes: mutableValidatorsCountVotes,
        }),
  ]);
};

export const getValidators = async (
  blockchain: Blockchain,
  transactions: readonly Transaction[],
): Promise<readonly ECPoint[]> => {
  const cache = new ValidatorCache(blockchain);
  await Promise.all(transactions.map(async (transaction) => processTransaction(blockchain, cache, transaction)));

  const { validatorChanges, validatorsCountChanges } = await getDescriptorChanges({
    transactions: transactions.filter(
      (transaction): transaction is StateTransaction =>
        transaction.type === TransactionType.State && transaction instanceof StateTransaction,
    ),

    getAccount: async (hash) => cache.getAccount(hash),
    governingTokenHash: blockchain.settings.governingToken.hashHex,
  });

  await processStateTransaction({
    validatorChanges,
    validatorsCountChanges,
    tryGetValidatorsCount: async () => cache.getValidatorsCount(),
    addValidatorsCount: async (value) => cache.addValidatorsCount(value),
    updateValidatorsCount: async (update) => {
      await cache.updateValidatorsCount(update);
    },
    tryGetValidator: async (key) => cache.getValidator(key.publicKey),
    addValidator: async (validator) => cache.addValidator(validator),
    deleteValidator: async (key) => cache.deleteValidator(key.publicKey),
    updateValidator: async (value, update) => cache.updateValidator(value.publicKey, update),
  });

  const [validatorsCount, validators] = await Promise.all([cache.getValidatorsCount(), cache.getAllValidators()]);

  const numValidators = Math.max(
    utils.weightedAverage(
      utils
        .weightedFilter(
          validatorsCount.votes
            .map((votes, count) => ({ count, votes: votes === undefined ? utils.ZERO : votes }))
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
    blockchain.settings.standbyValidators.map((publicKey) => common.ecPointToHex(publicKey)),
  );

  const validatorsPublicKeySet = new Set(
    _.take(
      validators
        .filter(
          (validator) =>
            (validator.registered && validator.votes.gt(utils.ZERO)) ||
            standbyValidatorsSet.has(common.ecPointToHex(validator.publicKey)),
        )
        .sort((aValidator, bValidator) =>
          aValidator.votes.eq(bValidator.votes)
            ? common.ecPointCompare(aValidator.publicKey, bValidator.publicKey)
            : -aValidator.votes.cmp(bValidator.votes),
        )
        .map((validator) => common.ecPointToHex(validator.publicKey)),
      numValidators,
    ),
  );

  const standbyValidatorsArray = [...standbyValidatorsSet];
  for (let i = 0; i < standbyValidatorsArray.length && validatorsPublicKeySet.size < numValidators; i += 1) {
    validatorsPublicKeySet.add(standbyValidatorsArray[i]);
  }

  const validatorsPublicKeys = [...validatorsPublicKeySet].map((hex) => common.hexToECPoint(hex));

  return validatorsPublicKeys.sort((aKey, bKey) => common.ecPointCompare(aKey, bKey));
};
