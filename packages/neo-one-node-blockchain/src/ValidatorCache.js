/* @flow */
import type BN from 'bn.js';
import {
  type ECPoint,
  type ECPointHex,
  type UInt160,
  type UInt160Hex,
  type UInt256,
  type ValidatorUpdate,
  Account,
  Validator,
  common,
  utils,
} from '@neo-one/client-core';
import {
  type ValidatorsCountUpdate,
  ValidatorsCount,
} from '@neo-one/node-core';

import _ from 'lodash';
import { toArray } from 'rxjs/operators';
import { utils as commonUtils } from '@neo-one/utils';

import type Blockchain from './Blockchain';

export default class ValidatorCache {
  blockchain: Blockchain;
  accounts: { [key: UInt160Hex]: Account };
  validators: { [key: ECPointHex]: ?Validator };
  validatorsCount: ?ValidatorsCount;

  constructor(blockchain: Blockchain) {
    this.blockchain = blockchain;
    this.accounts = {};
    this.validators = {};
    this.validatorsCount = null;
  }

  async getAccount(hash: UInt160): Promise<Account> {
    let account = this.accounts[common.uInt160ToHex(hash)];
    if (account == null) {
      account = await this.blockchain.account.tryGet({ hash });
    }

    if (account == null) {
      account = this.accounts[common.uInt160ToHex(hash)];
    }

    if (account == null) {
      account = new Account({ hash });
    }

    this.accounts[common.uInt160ToHex(hash)] = account;
    return account;
  }

  async updateAccountBalance(
    hash: UInt160,
    asset: UInt256,
    value: BN,
  ): Promise<void> {
    const assetHex = common.uInt256ToHex(asset);
    await this.getAccount(hash);
    const hashHex = common.uInt160ToHex(hash);
    const account = this.accounts[hashHex];
    this.accounts[hashHex] = account.update({
      balances: {
        ...account.balances,
        [(assetHex: $FlowFixMe)]: value.add(
          account.balances[assetHex] || utils.ZERO,
        ),
      },
    });
  }

  async getValidator(publicKey: ECPoint): Promise<Validator> {
    const publicKeyHex = common.ecPointToHex(publicKey);

    let validator = this.validators[publicKeyHex];
    if (validator == null) {
      validator = await this.blockchain.validator.tryGet({ publicKey });
    }

    if (validator == null) {
      validator = this.validators[publicKeyHex];
    }

    if (validator == null) {
      validator = new Validator({ publicKey });
    }

    this.validators[publicKeyHex] = validator;
    return validator;
  }

  async addValidator(validator: Validator): Promise<void> {
    this.validators[common.ecPointToHex(validator.publicKey)] = validator;
  }

  async deleteValidator(publicKey: ECPoint): Promise<void> {
    this.validators[common.ecPointToHex(publicKey)] = null;
  }

  async updateValidatorVotes(publicKey: ECPoint, value: BN): Promise<void> {
    await this.getValidator(publicKey);
    const publicKeyHex = common.ecPointToHex(publicKey);
    const validator = this.validators[publicKeyHex];
    if (validator == null) {
      throw new Error('For Flow');
    }

    this.validators[publicKeyHex] = validator.update({
      votes: validator.votes.add(value),
    });
  }

  async updateValidator(
    publicKey: ECPoint,
    update: ValidatorUpdate,
  ): Promise<Validator> {
    await this.getValidator(publicKey);
    const publicKeyHex = common.ecPointToHex(publicKey);
    const validator = this.validators[publicKeyHex];
    if (validator == null) {
      throw new Error('For Flow');
    }

    const newValidator = validator.update(update);
    this.validators[publicKeyHex] = newValidator;
    return newValidator;
  }

  async getAllValidators(): Promise<Array<Validator>> {
    const validators = await this.blockchain.validator.all
      .pipe(toArray())
      .toPromise();
    const publicKeyToValidator = _.fromPairs(
      validators.map(validator => [
        common.ecPointToHex(validator.publicKey),
        validator,
      ]),
    );
    for (const [publicKey, validator] of commonUtils.entries(this.validators)) {
      const publicKeyHex = common.ecPointToHex(publicKey);
      if (validator == null) {
        delete publicKeyToValidator[publicKeyHex];
      } else {
        publicKeyToValidator[publicKeyHex] = validator;
      }
    }

    return commonUtils.values(publicKeyToValidator);
  }

  async getValidatorsCount(): Promise<ValidatorsCount> {
    let { validatorsCount } = this;
    if (validatorsCount == null) {
      validatorsCount = await this.blockchain.validatorsCount.tryGet();
    }

    if (validatorsCount == null) {
      validatorsCount = new ValidatorsCount();
    }

    this.validatorsCount = validatorsCount;
    return validatorsCount;
  }

  async updateValidatorsCountVotes(index: number, value: BN): Promise<void> {
    await this.getValidatorsCount();
    const { validatorsCount } = this;
    if (validatorsCount == null) {
      throw new Error('For Flow');
    }

    this.validatorsCount = validatorsCount.update({
      votes: validatorsCount.votes
        .slice(0, index)
        .concat((validatorsCount.votes[index] || utils.ZERO).add(value))
        .concat(validatorsCount.votes.slice(index + 1)),
    });
  }

  async addValidatorsCount(validatorsCount: ValidatorsCount): Promise<void> {
    this.validatorsCount = validatorsCount;
  }

  async updateValidatorsCount(
    update: ValidatorsCountUpdate,
  ): Promise<ValidatorsCount> {
    await this.getValidatorsCount();
    const { validatorsCount } = this;
    if (validatorsCount == null) {
      throw new Error('For Flow');
    }

    this.validatorsCount = validatorsCount.update(update);
    return this.validatorsCount;
  }
}
